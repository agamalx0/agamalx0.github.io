#!/var/ossec/framework/python/bin/python3
import hashlib
import ipaddress
import json
import logging
import os
import re
import sys
from urllib.parse import urlsplit

import requests

LOG_FILE = "/var/ossec/logs/integrations.log"
LEVEL_THRESHOLD = 7
CUSTOMER_ID = 1  # Set to the customer ID from your IRIS instance.
STATUS_ID_NEW = 2  # Verify against your installed IRIS taxonomy.
WAZUH_DASHBOARD_URL = "https://WAZUH_DASHBOARD_HOST/app/wz-home"
# Optional: set to the PEM CA bundle used to verify the IRIS HTTPS certificate.
# Keep TLS verification enabled. None uses the Python/OS default trust store.
IRIS_CA_BUNDLE = None

# These IDs came from the IRIS IOC taxonomy inspected in the lab.
# Reconfirm them after upgrades or any taxonomy customization.
IOC_TYPE_IDS = {
    "ip-any": 76,
    "domain": 20,
    "url": 141,
    "md5": 90,
    "sha1": 111,
    "sha256": 113,
    "filename": 37,
    "email": 22,
}

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

FILE_EXTENSIONS = {
    ".exe", ".dll", ".sys", ".bat", ".cmd", ".ps1", ".vbs",
    ".js", ".hta", ".scr", ".msi", ".jar", ".sh", ".py",
}


def flatten_for_context(value, prefix="", max_items=40):
    """Flatten nested event data into readable, bounded key/value pairs."""
    result = {}
    sensitive_fragments = ("password", "secret", "api_key", "token", "authorization", "credential")

    def walk(node, path):
        if len(result) >= max_items or not path:
            return
        if isinstance(node, dict):
            for key, child in node.items():
                if any(fragment in str(key).lower() for fragment in sensitive_fragments):
                    continue
                child_path = f"{path}.{key}" if path else str(key)
                walk(child, child_path)
                if len(result) >= max_items:
                    break
        elif isinstance(node, list):
            if all(not isinstance(item, (dict, list)) for item in node):
                value_text = ", ".join(str(item) for item in node if item is not None)
                if value_text:
                    result[path] = value_text[:1000]
            else:
                for index, child in enumerate(node):
                    walk(child, f"{path}[{index}]")
                    if len(result) >= max_items:
                        break
        elif node is not None:
            value_text = str(node).replace("\r", " ").replace("\n", " ").strip()
            if value_text:
                result[path] = value_text[:1000]

    walk(value, prefix)
    return result


def build_context(alert):
    """Build a human-readable summary first, then add bounded nested event fields."""
    rule = alert.get("rule", {}) if isinstance(alert.get("rule"), dict) else {}
    agent = alert.get("agent", {}) if isinstance(alert.get("agent"), dict) else {}
    manager = alert.get("manager", {}) if isinstance(alert.get("manager"), dict) else {}
    decoder = alert.get("decoder", {}) if isinstance(alert.get("decoder"), dict) else {}
    mitre = rule.get("mitre", {}) if isinstance(rule.get("mitre"), dict) else {}

    context = {}

    def add(label, value, max_length=1000):
        if value is None or value == "":
            return
        if isinstance(value, list):
            value = ", ".join(str(item) for item in value if item not in (None, ""))
        elif isinstance(value, dict):
            value = json.dumps(value, ensure_ascii=False, sort_keys=True)
        value = str(value).replace("\r", " ").replace("\n", " ").strip()
        if value:
            context[label] = value[:max_length]

    add("Timestamp", alert.get("timestamp"))
    add("Wazuh Alert ID", alert.get("id"))
    add("Rule ID", rule.get("id"))
    add("Rule Level", rule.get("level"))
    add("Rule Description", rule.get("description"))
    add("Rule Groups", rule.get("groups"))
    add("Agent Name", agent.get("name"))
    add("Agent ID", agent.get("id"))
    add("Agent IP", agent.get("ip"))
    add("Manager", manager.get("name"))
    add("Decoder", decoder.get("name"))
    add("Event Location", alert.get("location"))
    add("MITRE Technique IDs", mitre.get("id"))
    add("MITRE Tactics", mitre.get("tactic"))
    add("MITRE Techniques", mitre.get("technique"))
    add("Full Log", alert.get("full_log"), max_length=1800)

    # Place event-specific fields in the Context table, not in an HTML blob.
    for section_name in ("data", "syscheck", "vulnerability"):
        section = alert.get(section_name)
        if isinstance(section, (dict, list)):
            for key, value in flatten_for_context(section, prefix=section_name, max_items=40).items():
                if len(context) >= 65:
                    break
                if key not in context:
                    context[key] = value
        if len(context) >= 65:
            break

    return context


def is_valid_ipv4(value):
    try:
        return isinstance(ipaddress.ip_address(value), ipaddress.IPv4Address)
    except ValueError:
        return False


def add_ioc(items, value, type_name, description):
    value = str(value).strip().rstrip(".,;)")
    if not value:
        return
    type_id = IOC_TYPE_IDS.get(type_name)
    if type_id is None:
        return
    items[(value.lower(), type_id)] = {
        "ioc_value": value,
        "ioc_description": description,
        "ioc_tlp_id": 1,  # Confirm TLP ID in your IRIS environment.
        "ioc_type_id": type_id,
        "ioc_tags": "wazuh",
    }


def extract_iocs(alert):
    """Prefer structured event fields, then scan selected text values."""
    found = {}

    data = alert.get("data", {})
    win = data.get("win", {}) if isinstance(data, dict) else {}
    eventdata = win.get("eventdata", {}) if isinstance(win, dict) else {}

    # Pull known structured fields first; file paths remain filenames, not domains.
    structured_candidates = []
    for field in ("image", "targetFilename", "ParentImage", "filePath", "filename"):
        candidate = eventdata.get(field)
        if isinstance(candidate, str) and candidate.strip():
            structured_candidates.append(candidate.strip())

    # Scan all string-valued fields to catch other telemetry, but classify by syntax.
    searchable = list(structured_candidates)

    def collect_strings(obj):
        if isinstance(obj, dict):
            for val in obj.values():
                collect_strings(val)
        elif isinstance(obj, list):
            for val in obj:
                collect_strings(val)
        elif isinstance(obj, str):
            searchable.append(obj)

    collect_strings(alert)

    seen_texts = set()
    for text in searchable:
        if text in seen_texts:
            continue
        seen_texts.add(text)

        # URLs first; strip common trailing punctuation.
        for match in re.findall(r"https?://[^\s\"'<>]+", text, flags=re.IGNORECASE):
            url = match.rstrip(".,;)]}")
            add_ioc(found, url, "url", "Extracted from Wazuh alert")

        # IPv4: validate each candidate instead of accepting 999.999.999.999.
        for match in re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", text):
            if is_valid_ipv4(match):
                add_ioc(found, match, "ip-any", "Extracted from Wazuh alert")

        # Hashes are matched by length.
        for match in re.findall(r"\b[a-fA-F0-9]{64}\b", text):
            add_ioc(found, match, "sha256", "SHA-256 candidate extracted from Wazuh alert")
        for match in re.findall(r"\b[a-fA-F0-9]{40}\b", text):
            add_ioc(found, match, "sha1", "SHA-1 candidate extracted from Wazuh alert")
        for match in re.findall(r"\b[a-fA-F0-9]{32}\b", text):
            add_ioc(found, match, "md5", "MD5 candidate extracted from Wazuh alert")

        # Extract complete filenames. Non-capturing groups keep the full match.
        for match in re.findall(
            r"(?i)(?<![A-Za-z0-9_.-])[A-Za-z0-9_.$@!~() -]+\.(?:exe|dll|sys|bat|cmd|ps1|vbs|js|hta|scr|msi|jar|sh|py)\b",
            text,
        ):
            filename = match.strip().strip('"')
            if filename:
                add_ioc(found, filename, "filename", "Filename candidate extracted from Wazuh alert")

        # Domain candidates: require a dotted hostname-like token and exclude file extensions.
        file_extensions = {ext.lstrip(".") for ext in FILE_EXTENSIONS}
        for match in re.findall(
            r"(?i)(?<![A-Za-z0-9_-])(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}\b",
            text,
        ):
            domain = match.rstrip(".")
            tld = domain.rsplit(".", 1)[-1].lower()
            if tld not in file_extensions and not is_valid_ipv4(domain):
                add_ioc(found, domain, "domain", "Domain candidate extracted from Wazuh alert")

        # Email addresses
        for match in re.findall(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}\b",
            text,
        ):
            add_ioc(found, match, "email", "Email address candidate extracted from Wazuh alert")

    return list(found.values())[:50]


def normalize_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item not in (None, "")]
    return [str(value)] if value != "" else []


def build_tags(alert):
    rule = alert.get("rule", {})
    agent = alert.get("agent", {})
    mitre = rule.get("mitre", {})

    raw_tags = [
        "wazuh",
        f"rule_{rule.get('id', 'unknown')}",
        str(agent.get("name", "unknown")),
        str(agent.get("ip", "unknown")),
    ]
    raw_tags += normalize_list(mitre.get("id"))
    raw_tags += normalize_list(mitre.get("tactic"))
    raw_tags += normalize_list(mitre.get("technique"))

    # IRIS alert_tags is a comma-separated string.
    return ",".join(
        tag.strip().replace(",", "_").replace(" ", "_")
        for tag in raw_tags if tag and tag.strip()
    )


def main():
    # Wazuh passes: alert_file, api_key, hook_url. For an interactive manual test,
    # an API key can instead be read from the temporary IRIS_API_KEY environment variable.
    if len(sys.argv) >= 4:
        alert_file, api_key, hook_url = sys.argv[1:4]
    elif len(sys.argv) == 3 and os.environ.get("IRIS_API_KEY"):
        alert_file, hook_url = sys.argv[1:3]
        api_key = os.environ["IRIS_API_KEY"]
    else:
        logging.error("Expected Wazuh arguments: alert_file api_key hook_url; manual mode supports alert_file hook_url plus IRIS_API_KEY")
        return 2

    if not api_key or not hook_url:
        logging.error("Missing IRIS API key or hook URL argument")
        return 2

    parsed_url = urlsplit(hook_url)
    if parsed_url.scheme.lower() != "https" or not parsed_url.hostname:
        logging.error("IRIS hook URL must be an absolute HTTPS URL")
        return 2

    try:
        with open(alert_file, "r", encoding="utf-8") as handle:
            alert = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        logging.error("Could not read Wazuh JSON alert: %s", exc)
        return 2

    rule = alert.get("rule", {})
    if not isinstance(rule, dict):
        rule = {}

    groups = normalize_list(rule.get("groups"))
    if any(group.lower() in {"cis", "sca"} for group in groups):
        logging.info("Skipping alert because rule group is excluded: %s", groups)
        return 0

    try:
        level = int(rule.get("level", 0))
    except (TypeError, ValueError):
        level = 0
    if level < LEVEL_THRESHOLD:
        return 0

    title = str(rule.get("description") or "Wazuh Alert")
    agent = alert.get("agent", {}) if isinstance(alert.get("agent"), dict) else {}
    mitre = rule.get("mitre", {}) if isinstance(rule.get("mitre"), dict) else {}
    summary_parts = [f"Rule ID: {rule.get('id', 'unknown')}", f"Level: {level}"]
    if agent.get("name"):
        summary_parts.append(f"Agent: {agent.get('name')}")
    if agent.get("ip"):
        summary_parts.append(f"Agent IP: {agent.get('ip')}")
    mitre_ids = normalize_list(mitre.get("id"))
    if mitre_ids:
        summary_parts.append("MITRE: " + ", ".join(mitre_ids))
    description_summary = " | ".join(summary_parts)[:1800]

    source_ref = alert.get("id")
    if not source_ref:
        stable_source = json.dumps(alert, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)
        source_ref = hashlib.sha256(stable_source.encode("utf-8")).hexdigest()[:32]

    severity_id = 6 if level >= 13 else 5 if level >= 10 else 4 if level >= 7 else 3

    payload = {
        "alert_title": title,
        "alert_description": description_summary,
        "alert_source": "Wazuh",
        "alert_source_ref": str(source_ref),
        "alert_source_link": WAZUH_DASHBOARD_URL,
        "alert_severity_id": severity_id,
        "alert_status_id": STATUS_ID_NEW,
        "alert_source_event_time": alert.get("timestamp"),
        "alert_note": "",
        "alert_tags": build_tags(alert),
        "alert_customer_id": CUSTOMER_ID,
        "alert_context": build_context(alert),
        "alert_iocs": extract_iocs(alert),
        "alert_source_content": alert,
    }

    try:
        response = requests.post(
            hook_url,
            json=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=(5, 20),
            verify=IRIS_CA_BUNDLE or True,
        )
        if response.status_code in (200, 201, 202, 204):
            logging.info(
                "Sent Wazuh rule=%s level=%s IOC_count=%s HTTP=%s",
                rule.get("id"), level, len(payload["alert_iocs"]), response.status_code,
            )
            return 0

        # Avoid logging credentials. Response bodies may contain internal details.
        # Avoid logging response bodies, which can contain case, identity, or event data.
        logging.error("IRIS API rejected alert: HTTP %s", response.status_code)
        return 1

    except requests.RequestException as exc:
        logging.error("IRIS request failed: %s", exc)
        return 1


if __name__ == "__main__":
    sys.exit(main())