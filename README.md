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

## Featured technical notes

### IBM QRadar SIEM

| Topic | What it covers |
|---|---|
| [What Is IBM QRadar SIEM?](https://agamalx0.github.io/articles/what-is-qradar-siem.html) | Core components, events and flows, correlation, offenses, and investigation context. |
| [QRadar Installation Guide](https://agamalx0.github.io/articles/qradar-installation.html) | Installation paths, appliance roles, prerequisites, and post-install validation. |
| [QRadar Health Check](https://agamalx0.github.io/articles/qradar-health-check.html) | Using DrQ, Recon, and Cliniq where supported, and understanding what the results prove. |
| [QRadar Troubleshooting Checklist](https://agamalx0.github.io/articles/qradar-troubleshooting.html) | Structured triage for services, managed hosts, deployment, storage, and ingestion symptoms. |
| [Ariel Proxy Search Failure](https://agamalx0.github.io/articles/qradar-ariel-proxy-search-failure.html) | Investigating filtered Log Activity searches and TCP port 32011. |
| [App Host API Certificate Recovery](https://agamalx0.github.io/articles/qradar-apphost-api-certificate-troubleshooting.html) | Troubleshooting x509 trust failures between the QRadar Console API and App Host application runtime. |
| [QRadar High Availability](https://agamalx0.github.io/articles/qradar-high-availability.html) | HA roles, failover readiness, state validation, and recovery considerations. |
| [QRadar Console Migration](https://agamalx0.github.io/articles/qradar-migration-guide.html) | Planning same-IP and new-IP Console replacement scenarios. |
| [QRadar Routing Rules](https://agamalx0.github.io/articles/qradar-routing-rules.html) | Forward, Drop, Bypass Correlation, and Log Only behavior and trade-offs. |

### Wazuh SIEM

| Topic | What it covers |
|---|---|
| [Wazuh All-in-One Installation](https://agamalx0.github.io/articles/wazuh-all-in-one-installation.html) | Installation workflow, configuration, and validation for an all-in-one deployment. |
| [Wazuh Distributed Architecture](https://agamalx0.github.io/articles/wazuh-distributed-architecture.html) | Roles and design considerations for a distributed Wazuh deployment. |
| [Wazuh MSSP Multi-Tenant Architecture](https://agamalx0.github.io/articles/wazuh-mssp-multi-tenant-architecture.html) | Tenant access design using identity integration, RBAC, and data-level controls. |

### Splunk Enterprise

| Topic | What it covers |
|---|---|
| [Install Splunk Enterprise on Ubuntu 24.04 LTS](https://agamalx0.github.io/articles/splunk-enterprise-installation-ubuntu-24-04.html) | Single-server lab installation, systemd boot-start troubleshooting, and Enterprise Trial-to-Free license considerations. |

Browse the full, current collection on the [portfolio homepage](https://agamalx0.github.io/#articles).

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
