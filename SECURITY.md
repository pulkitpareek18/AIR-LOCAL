# Security Policy

AirLocal takes security and privacy seriously. We appreciate the security community's efforts to help keep AirLocal and its users safe.

If you discover a security vulnerability, please report it responsibly so we can investigate and address it.

## Supported Versions

AirLocal is actively developed. Security fixes are prioritized for the latest version available on the `main` branch and the latest deployed release, where applicable.

| Version | Supported |
| ------- | --------- |
| Latest (`main`) | :white_check_mark: |
| Older versions | :x: |

Only versions explicitly identified as supported by the maintainers should be assumed to receive security updates.

## Reporting a Vulnerability

**Please do not disclose security vulnerabilities through public GitHub issues or public discussions.**

If you discover a potential vulnerability, report it privately through one of the following channels:

- **GitHub Security Advisories:** Open the repository's [Security Advisories](https://github.com/pulkitpareek18/AirLocal/security/advisories) page and select the option to report a vulnerability, if private reporting is enabled.
- **Private contact:** If private reporting is unavailable, contact the repository owner through GitHub to arrange a private disclosure channel.

Please do not include sensitive exploit details in public reports.

### What to Include

To help us investigate efficiently, include as much of the following information as possible:

- A clear description of the vulnerability and its potential impact.
- The affected component, version, or commit.
- Steps to reproduce the issue.
- Proof-of-concept code or screenshots, where safe and appropriate.
- Any relevant logs with personal information, credentials, tokens, and private connection details removed.
- Suggested mitigations or fixes, if available.

### Response Timeline

We aim to follow these response targets:

| Stage | Target |
| ----- | ------ |
| Initial acknowledgment | Within 3 business days |
| Initial assessment | Within 7 business days |
| Progress updates | At least every 7 business days while actively investigating |
| Resolution | Depends on severity, complexity, and affected components |

These are response targets, not guaranteed deadlines. We will communicate delays when reasonably possible.

### What Happens Next?

**If the report is accepted:**

1. We will investigate and assess the severity and impact.
2. We will work on a fix or mitigation.
3. We may request additional information to validate the issue.
4. We will coordinate disclosure with the reporter when appropriate.
5. We will publish relevant security updates after a fix is available, subject to responsible disclosure considerations.

**If the report is declined:**

We will explain the reasoning when possible. Reports may be declined if the behavior is intentional, cannot be reproduced, is outside the project's scope, or does not present a meaningful security risk.

If you disagree with the assessment, you may provide additional evidence or clarification for reconsideration.

## Scope

Security reports relevant to AirLocal include, but are not limited to:

- Unauthorized access to files or transfer sessions.
- Exposure of file contents or sensitive metadata.
- Vulnerabilities in peer-to-peer connection establishment or signaling.
- Improper authorization or validation of signaling messages.
- Cross-site scripting (XSS), injection, or other web application vulnerabilities.
- Security weaknesses involving WebRTC data channels.
- Unexpected data disclosure through logs, third-party services, or server components.
- Dependency vulnerabilities that materially affect AirLocal.
- Denial-of-service vulnerabilities affecting the application or its infrastructure.

Please report only issues that you are authorized to test. Do not access, modify, or disclose other users' data.

## Responsible Disclosure Guidelines

To protect AirLocal users and other researchers:

- Do not publicly disclose a vulnerability before coordinating with the maintainers.
- Do not exploit a vulnerability beyond what is necessary to demonstrate its impact.
- Do not disrupt services, conduct destructive testing, or access other users' files.
- Do not perform social engineering or attacks against other users or infrastructure.
- Remove personal information and sensitive data from reports and proof-of-concept materials.

We appreciate responsible disclosure and will make reasonable efforts to work with researchers toward a safe resolution.

## Security Design Principles

AirLocal is designed around direct device-to-device file sharing. Security-related contributions should preserve these principles:

- **Privacy first:** Avoid unnecessary collection or storage of user data.
- **Secure transfers:** Use appropriate browser-provided security mechanisms for communication.
- **Minimal data exposure:** Do not expose file contents or sensitive metadata through signaling or logging.
- **Input validation:** Treat incoming signaling messages and transfer metadata as untrusted.
- **Secure defaults:** Avoid weakening browser security protections or introducing unnecessary permissions.

Direct peer-to-peer connectivity is not guaranteed in every network environment. Network configuration and connectivity mechanisms may affect how devices establish connections.

## Recognition

We appreciate researchers and contributors who help improve AirLocal's security. With the reporter's permission, we may acknowledge their contribution in a security advisory or release notes.

Thank you for helping keep AirLocal secure.

---

*This policy may be updated as the project and its security practices evolve.*
