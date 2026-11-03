#!/usr/bin/env python3
"""Focused Sigma YAML to Wazuh XML converter for selected Windows categories.

This is a conservative lab prototype, not a complete Sigma backend. Unsupported
fields and condition syntax are skipped rather than translated into broad matches.
"""
from __future__ import annotations

import argparse
import glob
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from xml.sax.saxutils import escape

import yaml

START_ID = 113000
CUSTOM_ID_MIN, CUSTOM_ID_MAX = 100000, 120000
DEFAULT_INCLUDE = ("powershell", "registry", "network_connection")
DEFAULT_EXCLUDE = ("process_creation", "file_event")

CATEGORY_BUCKET = {
    "ps_script": "powershell", "ps_module": "powershell",
    "ps_classic_start": "powershell", "ps_classic_provider_start": "powershell",
    "ps_classic_script": "powershell", "powershell": "powershell",
    "powershell-classic": "powershell",
    "registry_event": "registry", "registry_add": "registry",
    "registry_delete": "registry", "registry_set": "registry",
    "registry_rename": "registry",
}

# Verify these parent SIDs against the ruleset installed on the target manager.
# PowerShell parents are supplied by the operator because event channels differ.
PARENT_SIDS = {
    ("windows", "network_connection"): "61605",
    ("windows", "registry_event"): "61614,61615,61616",
    ("windows", "registry_add"): "61614",
    ("windows", "registry_delete"): "61614",
    ("windows", "registry_set"): "61615",
    ("windows", "registry_rename"): "61616",
}

FIELD_MAP = {
    "Image": "win.eventdata.image",
    "OriginalFileName": "win.eventdata.originalFileName",
    "CommandLine": "win.eventdata.commandLine",
    "ParentImage": "win.eventdata.parentImage",
    "ParentCommandLine": "win.eventdata.parentCommandLine",
    "User": "win.eventdata.user",
    "IntegrityLevel": "win.eventdata.integrityLevel",
    "CurrentDirectory": "win.eventdata.currentDirectory",
    "TargetFilename": "win.eventdata.targetFilename",
    "TargetObject": "win.eventdata.targetObject",
    "Details": "win.eventdata.details",
    "NewName": "win.eventdata.newName",
    "EventType": "win.eventdata.eventType",
    "DestinationIp": "win.eventdata.destinationIp",
    "DestinationHostname": "win.eventdata.destinationHostname",
    "DestinationPort": "win.eventdata.destinationPort",
    "SourceIp": "win.eventdata.sourceIp",
    "SourcePort": "win.eventdata.sourcePort",
    "Protocol": "win.eventdata.protocol",
    "Initiated": "win.eventdata.initiated",
    "ImageLoaded": "win.eventdata.imageLoaded",
    "Signed": "win.eventdata.signed",
    "Signature": "win.eventdata.signature",
    "SignatureStatus": "win.eventdata.signatureStatus",
    "SourceImage": "win.eventdata.sourceImage",
    "TargetImage": "win.eventdata.targetImage",
    "GrantedAccess": "win.eventdata.grantedAccess",
    "CallTrace": "win.eventdata.callTrace",
    "StartModule": "win.eventdata.startModule",
    "StartFunction": "win.eventdata.startFunction",
    "PipeName": "win.eventdata.pipeName",
    "QueryName": "win.eventdata.queryName",
    "QueryResults": "win.eventdata.queryResults",
    "QueryStatus": "win.eventdata.queryStatus",
    "ScriptBlockText": "win.eventdata.scriptBlockText",
    "ScriptBlockId": "win.eventdata.scriptBlockId",
    "Payload": "win.eventdata.payload",
    "ContextInfo": "win.eventdata.contextInfo",
    "HostApplication": "win.eventdata.hostApplication",
    "Destination": "win.eventdata.destination",
    "Consumer": "win.eventdata.consumer",
    "Query": "win.eventdata.query",
    "EventID": "win.system.eventID",
    "Provider_Name": "win.system.providerName",
    "Channel": "win.system.channel",
    "ServiceName": "win.eventdata.serviceName",
    "ImagePath": "win.eventdata.imagePath",
    "TargetUserName": "win.eventdata.targetUserName",
    "SubjectUserName": "win.eventdata.subjectUserName",
    "LogonType": "win.eventdata.logonType",
    "IpAddress": "win.eventdata.ipAddress",
    "WorkstationName": "win.eventdata.workstationName",
    "TaskName": "win.eventdata.taskName",
}
LEVEL_MAP = {"informational": 3, "low": 5, "medium": 8, "high": 12, "critical": 15}


class UnsupportedRule(ValueError):
    pass


def value_pattern(value, modifiers):
    text = str(value)
    if "re" in modifiers:
        pattern = text
    else:
        out = []
        for char in text:
            if char == "*":
                out.append(".*")
            elif char == "?":
                out.append(".")
            elif char in r"\.^$+?{}[]|()":
                out.append("\\" + char)
            else:
                out.append(char)
        pattern = "".join(out)
    if "contains" in modifiers:
        pattern = ".*" + pattern + ".*"
    elif "startswith" in modifiers:
        pattern = "^" + pattern
    elif "endswith" in modifiers:
        pattern += "$"
    if "windash" in modifiers:
        pattern = re.sub(r"(?<!\\)-", "[-/–—―]", pattern)
    if "cased" not in modifiers:
        pattern = "(?i)" + pattern
    return pattern


def build_fields(selection, negate=False):
    if not isinstance(selection, dict):
        raise UnsupportedRule("selection is not a field mapping")
    elements = []
    for raw_field, raw_values in selection.items():
        parts = str(raw_field).split("|")
        sigma_field, modifiers = parts[0], parts[1:]
        allowed = {"contains", "startswith", "endswith", "windash", "re", "cased", "all"}
        if set(modifiers) - allowed:
            raise UnsupportedRule("unsupported modifier: " + str(set(modifiers) - allowed))
        wazuh_field = FIELD_MAP.get(sigma_field)
        if not wazuh_field:
            raise UnsupportedRule("unmapped Sigma field: " + sigma_field)
        values = raw_values if isinstance(raw_values, list) else [raw_values]
        if not values or any(isinstance(v, (dict, list)) for v in values):
            raise UnsupportedRule("nested or empty values are unsupported")
        values = [v for v in values if v is not None]
        attr = ' negate="yes"' if negate else ""
        if "all" in modifiers:
            for value in values:
                pattern = escape(value_pattern(value, modifiers))
                elements.append(f'    <field name="{wazuh_field}" type="pcre2"{attr}>{pattern}</field>')
        else:
            patterns = [value_pattern(v, modifiers) for v in values]
            joined = patterns[0] if len(patterns) == 1 else "(?:" + "|".join(patterns) + ")"
            elements.append(f'    <field name="{wazuh_field}" type="pcre2"{attr}>{escape(joined)}</field>')
    if not elements:
        raise UnsupportedRule("selection generated no field conditions")
    return elements


def parse_condition(detection):
    if not isinstance(detection, dict):
        raise UnsupportedRule("detection is not a mapping")
    condition = str(detection.get("condition", "")).strip()
    selections = {k: v for k, v in detection.items() if k != "condition"}
    if not condition or any(x in condition.lower() for x in (" near ", " timeframe ", "count(", "|", " not ")):
        raise UnsupportedRule("unsupported condition syntax")
    if condition in selections:
        return [build_fields(selections[condition])]
    match = re.fullmatch(r"(?:1|any) of ([\w*]+)", condition)
    if match:
        key = match.group(1)
        selector = "^.*$" if key == "them" else "^" + re.escape(key).replace(r"\*", ".*") + "$"
        names = [n for n in selections if re.match(selector, n)]
        if not names:
            raise UnsupportedRule("1 of condition matched no selections")
        return [build_fields(selections[n]) for n in names]
    if condition.startswith("all of "):
        key = condition[len("all of "):].strip()
        selector = "^.*$" if key == "them" else "^" + re.escape(key).replace(r"\*", ".*") + "$"
        names = [n for n in selections if re.match(selector, n)]
        if not names:
            raise UnsupportedRule("all of condition matched no selections")
        combined = []
        for name in names:
            combined.extend(build_fields(selections[name]))
        return [combined]
    if " or " in condition and " and " not in condition:
        names = [n.strip() for n in condition.split(" or ")]
        if any(n not in selections for n in names):
            raise UnsupportedRule("condition references missing selection")
        return [build_fields(selections[n]) for n in names]
    if " and " in condition and " or " not in condition:
        names = [n.strip() for n in condition.split(" and ")]
        if any(n not in selections for n in names):
            raise UnsupportedRule("condition references missing selection")
        combined = []
        for name in names:
            combined.extend(build_fields(selections[name]))
        return [combined]
    raise UnsupportedRule("condition is outside the supported subset")


def main():
    parser = argparse.ArgumentParser(description="Convert a supported subset of Sigma Windows rules into Wazuh XML.")
    parser.add_argument("-i", "--input", required=True, help="Sigma YAML file or rules directory")
    parser.add_argument("-o", "--output-dir", default="./output_xml")
    parser.add_argument("--include", nargs="+", default=list(DEFAULT_INCLUDE))
    parser.add_argument("--exclude", nargs="+", default=list(DEFAULT_EXCLUDE))
    parser.add_argument("--start-id", type=int, default=START_ID)
    parser.add_argument("--group", default="sigma_wazuh")
    parser.add_argument("--prefix", default="SN - ")
    parser.add_argument("--id-map", default="sigma_rule_ids.json")
    parser.add_argument("--existing-xml", nargs="*", default=[])
    parser.add_argument("--parent-sid", nargs="*", default=[],
                        help="PowerShell overrides, e.g. ps_script=SID ps_module=SID (verify locally)")
    args = parser.parse_args()
    if not CUSTOM_ID_MIN <= args.start_id <= CUSTOM_ID_MAX:
        parser.error(f"--start-id must be in {CUSTOM_ID_MIN}-{CUSTOM_ID_MAX}")

    includes = {x.lower() for x in args.include}
    excludes = {x.lower() for x in args.exclude}
    overrides = {}
    for item in args.parent_sid:
        if "=" not in item:
            parser.error("--parent-sid expects CATEGORY=SID")
        key, sid = item.split("=", 1)
        if not key.strip() or not re.fullmatch(r"\d+(?:,\d+)*", sid.strip()):
            parser.error("invalid parent SID: " + item)
        overrides[key.strip().lower()] = sid.strip()

    source = Path(args.input).expanduser()
    if not source.exists():
        parser.error("input path does not exist: " + str(source))
    yml_files = [source] if source.is_file() else sorted([*source.rglob("*.yml"), *source.rglob("*.yaml")])
    output = Path(args.output_dir).expanduser()
    output.mkdir(parents=True, exist_ok=True)
    map_path = Path(args.id_map).expanduser()
    try:
        id_map = json.loads(map_path.read_text()) if map_path.exists() else {}
        if not isinstance(id_map, dict):
            id_map = {}
    except (OSError, json.JSONDecodeError):
        print("[!] Could not read ID map; starting a new map", file=sys.stderr)
        id_map = {}

    patterns = args.existing_xml or [str(output / "*.xml")]
    used = set()
    rule_re = re.compile(r"<rule\b[^>]*\bid=['\"](\d+)['\"]", re.I)
    for pattern in patterns:
        for filename in glob.glob(str(Path(pattern).expanduser())):
            try:
                used.update(int(m.group(1)) for m in rule_re.finditer(Path(filename).read_text(errors="ignore")))
            except OSError:
                pass
    for values in id_map.values():
        if isinstance(values, list):
            used.update(int(v) for v in values if str(v).isdigit())
    next_id = max(args.start_id, max(used, default=args.start_id - 1) + 1)

    grouped = defaultdict(list)
    counts = defaultdict(int)
    converted = skipped = excluded = generated = 0
    for file in yml_files:
        if {p.lower() for p in file.parts} & excludes:
            excluded += 1
            continue
        try:
            documents = list(yaml.safe_load_all(file.read_text(encoding="utf-8")))
        except (OSError, yaml.YAMLError):
            skipped += 1
            continue
        for doc in documents:
            if not isinstance(doc, dict) or "title" not in doc or "detection" not in doc:
                continue
            if str(doc.get("status", "")).lower() in {"deprecated", "unsupported"} or "correlation" in doc:
                skipped += 1
                continue
            logsource = doc.get("logsource")
            if not isinstance(logsource, dict) or str(logsource.get("product", "")).lower() != "windows":
                skipped += 1
                continue
            category = str(logsource.get("category", "")).lower().strip()
            service = str(logsource.get("service", "")).lower().strip()
            bucket = CATEGORY_BUCKET.get(category or service, category or service)
            if category in excludes or service in excludes or bucket in excludes:
                excluded += 1
                continue
            if bucket not in includes:
                skipped += 1
                continue
            parent = overrides.get(category) or overrides.get(service) or overrides.get(bucket)
            parent = parent or PARENT_SIDS.get(("windows", category)) or PARENT_SIDS.get(("windows", service))
            if not parent:
                skipped += 1
                continue
            try:
                branches = parse_condition(doc["detection"])
            except UnsupportedRule:
                skipped += 1
                continue

            sigma_id = str(doc.get("id") or doc["title"]).strip()
            ids = id_map.get(sigma_id, [])
            if not isinstance(ids, list):
                ids = []
            ids = [int(v) for v in ids if str(v).isdigit()]
            while len(ids) < len(branches):
                while next_id in used:
                    next_id += 1
                if next_id > CUSTOM_ID_MAX:
                    raise RuntimeError("Wazuh custom Rule ID range is exhausted")
                ids.append(next_id)
                used.add(next_id)
                next_id += 1
            id_map[sigma_id] = ids

            mitre = sorted({m.group(1).upper() for tag in doc.get("tags", [])
                            if (m := re.match(r"^attack\.(t\d{4}(?:\.\d{3})?)$", str(tag), re.I))})
            level = LEVEL_MAP.get(str(doc.get("level", "medium")).lower(), 8)
            subgroup = re.sub(r"[^a-zA-Z0-9_-]", "_", category or service or bucket)
            for index, fields in enumerate(branches):
                description = args.prefix + str(doc["title"]).strip()
                if len(branches) > 1:
                    description += f" (Part {index + 1})"
                block = [
                    f'  <!-- Sigma ID: {escape(sigma_id)} | Source: {escape(file.name)} -->',
                    f'  <rule id="{ids[index]}" level="{level}">',
                    f'    <if_sid>{escape(parent)}</if_sid>',
                    *fields,
                    f'    <description>{escape(description)}</description>',
                ]
                if mitre:
                    block += ["    <mitre>", *[f"      <id>{m}</id>" for m in mitre], "    </mitre>"]
                block += [f'    <group>{escape(args.group)},windows,{escape(subgroup)},</group>', "  </rule>"]
                grouped[bucket].extend(block)
                counts[bucket] += 1
                generated += 1
            converted += 1

    for bucket, rules in sorted(grouped.items()):
        lines = [f"<!-- Generated by sigma2wazuh.py | Wazuh 4.14.0 lab profile | {bucket} -->",
                 f'<group name="{escape(args.group)},">', *rules, "</group>"]
        (output / f"SN_sigma_{bucket}.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    map_path.parent.mkdir(parents=True, exist_ok=True)
    map_path.write_text(json.dumps(id_map, indent=2) + "\n", encoding="utf-8")
    print("[+] Conversion complete")
    print(f"    Sigma rules converted : {converted}")
    print(f"    Wazuh XML rules built : {generated}")
    print(f"    Excluded inputs       : {excluded}")
    print(f"    Skipped/unsupported   : {skipped}")
    print(f"    Output directory      : {output.resolve()}")
    for bucket, count in sorted(counts.items()):
        print(f"    - SN_sigma_{bucket}.xml : {count} rules")


if __name__ == "__main__":
    raise SystemExit(main())
