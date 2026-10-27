<div align="center">

# Ashraf Gamal

### SIEM Engineering · Detection Engineering · Threat Hunting · Security Automation

Practical notes from building, operating, troubleshooting, and improving security monitoring platforms.

[**Open the live portfolio →**](https://agamalx0.github.io/)

[![Portfolio](https://img.shields.io/badge/Portfolio-agamalx0.github.io-00f59b?style=for-the-badge&logo=githubpages&logoColor=0a0b0d)](https://agamalx0.github.io/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/1elrawy/)
[![GitHub](https://img.shields.io/badge/GitHub-agamalx0-181717?style=for-the-badge&logo=github)](https://github.com/agamalx0)

</div>

---

## About this repository

This repository powers my cybersecurity portfolio and technical notebook, published with **GitHub Pages**. It documents practical work in Security Operations Centers (SOCs), including SIEM deployment, platform administration, detection logic, troubleshooting, and operational validation.

The focus is on reproducible procedures and field-oriented lessons: what to check, how to collect useful evidence, where version differences matter, and how to validate that a change actually worked.

## All technical articles

Browse the complete portfolio by topic. Every HTML article in the repository is listed below and is also available from the [full article library](https://agamalx0.github.io/articles.html).

### IBM QRadar SIEM

| Article | Coverage |
|---|---|
| [What Is IBM QRadar SIEM?](https://agamalx0.github.io/articles/what-is-qradar-siem.html) | Components, events and flows, correlation, offenses, and investigation context. |
| [QRadar Installation Guide](https://agamalx0.github.io/articles/qradar-installation.html) | Installation paths, appliance roles, prerequisites, and post-install validation. |
| [QRadar Health Check](https://agamalx0.github.io/articles/qradar-health-check.html) | DrQ, Recon, Cliniq, and validation limits. |
| [QRadar Troubleshooting Checklist](https://agamalx0.github.io/articles/qradar-troubleshooting.html) | Evidence-led triage for host, service, deployment, storage, and ingestion issues. |
| [QRadar GUI and Tomcat Recovery](https://agamalx0.github.io/articles/qradar-tomcat-cache-ui-troubleshooting.html) | Backend checks and supported Tomcat cache recovery considerations. |
| [Ariel Proxy Search Failure](https://agamalx0.github.io/articles/qradar-ariel-proxy-search-failure.html) | Filtered Log Activity searches, transient search data, and TCP 32011. |
| [QRadar App Installation Blocked](https://agamalx0.github.io/articles/qradar-app-install-task-stuck.html) | Stale Extension Management task state and controlled database recovery. |
| [QRadar App Host API Certificate Recovery](https://agamalx0.github.io/articles/qradar-apphost-api-certificate-troubleshooting.html) | TLS trust, SAN validation, and App Host API communication errors. |
| [QRadar Operations Essentials](https://agamalx0.github.io/articles/qradar-operations-essentials.html) | Deployment, EPS/FPM, service operations, and production-safe checks. |
| [QRadar Upgrade Guide](https://agamalx0.github.io/articles/qradar-upgrade-guide.html) | Version-path validation, preparation, change execution, and post-upgrade checks. |
| [QRadar High Availability](https://agamalx0.github.io/articles/qradar-high-availability.html) | HA roles, failover readiness, state validation, and recovery considerations. |
| [QRadar Console Migration](https://agamalx0.github.io/articles/qradar-migration-guide.html) | Same-IP and new-IP Console replacement planning. |
| [QRadar Routing Rules](https://agamalx0.github.io/articles/qradar-routing-rules.html) | Forward, Drop, Bypass Correlation, Log Only, and routing-rule validation. |

### IBM QRadar SOAR

| Article | Coverage |
|---|---|
| [IBM QRadar SOAR Upgrade Guide](https://agamalx0.github.io/articles/qradar-soar-upgrade-guide.html) | On-premises Virtual Appliance upgrade planning, execution, and validation. |

### Wazuh SIEM

| Article | Coverage |
|---|---|
| [Wazuh All-in-One Installation](https://agamalx0.github.io/articles/wazuh-all-in-one-installation.html) | Single-host deployment, configuration, and validation. |
| [Wazuh Distributed Architecture](https://agamalx0.github.io/articles/wazuh-distributed-architecture.html) | Multi-node roles, networking, certificates, and load balancing. |
| [Wazuh MSSP Multi-Tenant Architecture](https://agamalx0.github.io/articles/wazuh-mssp-multi-tenant-architecture.html) | Tenant access design, identity integration, RBAC, and data-level controls. |
| [Wazuh SIEM with DFIR-IRIS](https://agamalx0.github.io/articles/wazuh-dfir-iris-integration.html) | Alert integration, case-management workflow, IOC mapping, and API validation. |

### Splunk Enterprise

| Article | Coverage |
|---|---|
| [Install Splunk Enterprise on Ubuntu 24.04 LTS](https://agamalx0.github.io/articles/splunk-enterprise-installation-ubuntu-24-04.html) | Single-server lab installation, systemd startup, validation, and license path. |

### Workflow automation and n8n

| Article | Coverage |
|---|---|
| [Automated Wazuh Daily Healthcheck with n8n](https://agamalx0.github.io/articles/wazuh-daily-healthcheck-n8n-email-report.html) | Daily SSH-based checks, warning summaries, HTML-to-PDF report generation, Gotenberg conversion, and automated email delivery. |
| [Installing n8n for Local Workflow Automation](https://agamalx0.github.io/articles/n8n-installation-local-automation.html) | Self-hosted n8n setup, configuration persistence, and local access. |
| [Testing n8n Webhooks Locally with curl](https://agamalx0.github.io/articles/testing-n8n-webhooks-locally-curl.html) | Test and production URLs, incoming JSON, and webhook troubleshooting. |

### Malware analysis and sandboxing

| Article | Coverage |
|---|---|
| [Cuckoo Sandbox with vSphere & YARA](https://agamalx0.github.io/articles/cuckoo-sandbox-vsphere-yara.html) | Cuckoo lab notes covering vSphere-managed guests, PCAP troubleshooting, YARA compatibility, and detection validation. |

## Technical focus

- **SIEM engineering:** IBM QRadar SIEM and Wazuh deployment, administration, log-source onboarding, health checks, retention, and troubleshooting.
- **Detection engineering:** rule logic, tuning, parsing, and improving alert context for investigations.
- **Threat hunting and incident response:** evidence-driven triage, event and flow investigation, and validation of security findings.
- **Security automation and integrations:** API-driven workflows and integrations across security platforms and case-management tools.
- **Platform operations:** distributed deployments, high availability, capacity, upgrades, migration planning, and recovery validation.

## Repository structure

```text
/
├── index.html              # Portfolio homepage
├── articles/               # Individual technical articles
└── assets/
    ├── css/                # Shared portfolio styling
    ├── js/                 # Theme, UI, and visit-counter behavior
    └── images/             # Article diagrams and screenshots
```

The site is built primarily with HTML, CSS, and JavaScript and is published through GitHub Pages.

## Connect

- **Portfolio:** https://agamalx0.github.io/
- **LinkedIn:** https://www.linkedin.com/in/1elrawy/
- **GitHub:** https://github.com/agamalx0
- **Email:** as.ga2019@gmail.com
- **WhatsApp:** https://wa.me/966598243358

---

<sub>Technical notes are intended for learning and operational reference. Commands, supported roles, UI paths, and recovery procedures can vary by product version and deployment. Validate changes against the applicable vendor documentation and your organization's change-control process before using them in production.</sub>
