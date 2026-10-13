# Contributing to AirLocal

First off, thank you for considering contributing to **AirLocal**! Every contribution helps make local, peer-to-peer file sharing simpler, faster, and more accessible across devices.

AirLocal aims to be **AirDrop for every device** — a browser-based way to transfer files between Android, iOS, Windows, macOS, and Linux without installing a dedicated application.

We welcome bug reports, feature suggestions, code contributions, documentation improvements, UI/UX enhancements, and ideas that make AirLocal more reliable and accessible.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contribution Guidelines](#contribution-guidelines)
- [Privacy and Security](#privacy-and-security)
- [Testing Your Changes](#testing-your-changes)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Community](#community)
- [License](#license)

## Code of Conduct

We are committed to maintaining a welcoming, respectful, and inclusive environment for everyone contributing to AirLocal.

By participating, you agree to:

- Be respectful and constructive in discussions.
- Welcome contributors of different backgrounds and experience levels.
- Provide actionable feedback and accept constructive criticism.
- Focus on what is best for the project and its community.
- Avoid harassment, discrimination, personal attacks, and disruptive behavior.

## Ways to Contribute

There are many ways to help improve AirLocal:

- **Bug fixes:** Resolve issues affecting transfers, connectivity, or the user interface.
- **Peer-to-peer networking:** Improve WebRTC connectivity, signaling, and connection reliability.
- **Cross-platform compatibility:** Test and improve support across browsers, operating systems, and devices.
- **Performance:** Optimize file transfers, memory usage, and large-file handling.
- **User experience:** Improve the interface, accessibility, and transfer feedback.
- **Privacy and security:** Identify vulnerabilities and strengthen secure data handling.
- **Documentation:** Improve setup instructions, troubleshooting guides, and technical documentation.
- **Testing:** Add automated tests and verify behavior across different device combinations.

If you are unsure where to begin, look for open issues or propose an improvement before starting substantial work.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Git](https://git-scm.com/)
- [Node.js 20](https://nodejs.org/) or a compatible version supported by the project
- npm
- A modern browser with WebRTC support

### 1. Fork the repository

Fork the AirLocal repository on GitHub:

https://github.com/pulkitpareek18/AirLocal

### 2. Clone your fork

```bash
git clone https://github.com/<your-username>/AirLocal.git
cd AirLocal
```

### 3. Add the upstream repository

```bash
git remote add upstream https://github.com/pulkitpareek18/AirLocal.git
```

### 4. Install dependencies

```bash
npm ci
```

### 5. Start the development server

```bash
npm run dev
```

Open the local URL printed in your terminal and verify that the application loads correctly.

> If a command differs from the current project configuration, refer to the repository's `package.json` and existing documentation.

## Development Workflow

### 1. Create a branch

Create a dedicated branch for your contribution.

```bash
git checkout -b feat/your-feature
```

Use a descriptive branch name:

- `feat/transfer-progress`
- `fix/webrtc-connection`
- `docs/update-readme`
- `refactor/signaling-service`
- `test/file-transfer`

### 2. Make your changes

Keep your changes focused, readable, and consistent with the existing codebase.

- Follow the established project structure and coding conventions.
- Prefer small, maintainable changes over unnecessary rewrites.
- Avoid introducing dependencies unless they provide clear value.
- Keep unrelated formatting changes out of your pull request.
- Update documentation when behavior or setup instructions change.

### 3. Validate your changes

Before submitting a pull request, run the available checks:

```bash
npm run check
npm run build
```

If your change affects deployment-specific behavior, also test the GitHub Pages build:

```bash
npm run build -- --mode github-pages
```

Fix any errors introduced by your changes before opening a pull request.

### 4. Commit your changes

Write clear commit messages describing what changed.

Examples:

```text
feat: improve transfer progress feedback
fix: handle interrupted peer connections
docs: clarify local development setup
test: cover file transfer validation
```

### 5. Push your branch

```bash
git push origin feat/your-feature
```

Then open a pull request against the upstream repository's `main` branch.

## Contribution Guidelines

### Code quality

- Write clear, maintainable code.
- Use meaningful variable and function names.
- Handle errors explicitly, especially during connection setup and file transfers.
- Avoid silently swallowing errors.
- Keep functions focused on a single responsibility.
- Remove temporary debugging statements before submitting changes.

### User interface

- Maintain AirLocal's clean, lightweight, and responsive design.
- Ensure the interface works on both mobile and desktop screens.
- Provide clear feedback for connecting, sending, receiving, completed, and failed transfers.
- Preserve accessibility, including keyboard navigation and readable contrast.
- Avoid unnecessary UI complexity that interferes with the transfer experience.

### Networking and file transfers

AirLocal uses WebRTC for peer-to-peer communication, with a signaling mechanism to help devices discover and establish connections.

When working on networking or transfer functionality:

- Preserve direct peer-to-peer data transfer wherever possible.
- Keep signaling separate from the actual file-transfer data path.
- Handle connection failures, timeouts, and interrupted transfers gracefully.
- Consider differences in browser behavior, NAT configurations, and firewall restrictions.
- Avoid assuming that every network supports direct WebRTC connectivity.
- Test transfers in both directions and across different device types.
- Avoid loading entire large files into memory unnecessarily.
- Validate received metadata and file-transfer messages before processing them.

### Dependencies

Before adding a new dependency:

1. Check whether the functionality already exists in the project.
2. Evaluate the dependency's maintenance, security, size, and compatibility.
3. Prefer lightweight solutions where practical.
4. Explain why the dependency is needed in your pull request.

## Privacy and Security

Privacy is a core principle of AirLocal.

Contributions must preserve the distinction between signaling and file transfer: signaling helps peers establish a connection, while file data should travel directly between connected devices whenever the network permits.

Please follow these principles:

- Do not introduce server-side file storage or file uploads without explicit project approval.
- Do not log file contents, sensitive metadata, or private connection information unnecessarily.
- Never commit API keys, credentials, tokens, or other secrets.
- Validate untrusted input and handle malformed messages safely.
- Do not introduce third-party tracking or analytics without appropriate review.
- Avoid weakening existing browser security protections.
- Report potential security vulnerabilities privately rather than publishing exploitable details in public issues.

**Important:** Direct peer-to-peer connectivity is not guaranteed on every network. Do not describe transfers as universally direct or guaranteed to succeed when restrictive NATs or firewalls may prevent a connection.

## Testing Your Changes

AirLocal must work across different browsers, devices, and network conditions.

Whenever possible, test your changes against the following scenarios:

| Area | What to verify |
|---|---|
| Device compatibility | Android, iOS, Windows, macOS, and Linux where available |
| Browser compatibility | Current supported versions of major browsers |
| Connectivity | Successful connection establishment and connection failures |
| Transfers | Small files, large files, and multiple files |
| Transfer integrity | Received files match the originals |
| Error handling | Interrupted connections, cancelled transfers, and invalid input |
| User experience | Clear progress, status, and error messages |
| Privacy | File data is not inadvertently uploaded or exposed |

Testing on physical devices is particularly valuable because browser behavior and network connectivity can differ significantly between desktop and mobile environments.

If you cannot test every platform, clearly state which environments you tested in your pull request.

## Pull Request Process

Before submitting your pull request:

- [ ] Your changes address a specific issue or clearly described improvement.
- [ ] Your branch is up to date with the target branch.
- [ ] The code follows existing conventions.
- [ ] Relevant checks and builds pass.
- [ ] You have tested the affected functionality.
- [ ] Documentation has been updated where necessary.
- [ ] No secrets, generated files, or unrelated changes have been included.

In your pull request description, include:

1. **Summary:** What changed?
2. **Motivation:** Why is the change needed?
3. **Implementation:** How does it work?
4. **Testing:** Which commands, browsers, devices, and scenarios were tested?
5. **Screenshots or recordings:** Include them for user-interface changes.
6. **Related issues:** Reference any relevant issues.

Keep pull requests focused. If a contribution involves several unrelated improvements, consider splitting it into smaller pull requests.

Maintainers may request changes or additional testing before merging. Please be patient and respond constructively to feedback.

## Reporting Bugs

Before opening a bug report, check whether the issue has already been reported.

When reporting a bug, include:

- A clear and descriptive title.
- Steps to reproduce the issue.
- Expected behavior.
- Actual behavior.
- Browser and version.
- Operating system and device type.
- Relevant console errors or logs, with sensitive information removed.
- Whether the issue occurs consistently or only on certain networks.

For transfer or connectivity issues, also mention whether the devices are on the same local network or different networks, when relevant.

Do not include private files, personal data, credentials, or sensitive connection details in public reports.

## Suggesting Features

We welcome ideas that improve the accessibility, reliability, privacy, and usability of AirLocal.

When suggesting a feature, explain:

- The problem you are trying to solve.
- How the feature would help users.
- A possible implementation, if you have one.
- Any compatibility, privacy, security, or performance considerations.

For significant changes, open an issue or discussion before implementing the feature. This helps avoid duplicated work and ensures the proposal aligns with the project's direction.

## Community

Whether you are fixing a small bug, improving documentation, testing on a new device, or proposing a major feature, your contribution matters.

If you are new to open source, you are welcome to start with documentation improvements, reproducible bug reports, testing, or small, well-scoped fixes.

Please use the repository's available GitHub Issues and Pull Requests to coordinate contributions and discuss proposed changes.

## License

By contributing to AirLocal, you agree that your contributions will be distributed under the license applicable to the project.

Please review the repository's `LICENSE` file before contributing. If you submit code or other materials, ensure you have the right to contribute them under the project's licensing terms.

---

**Thank you for helping make file sharing simpler, more private, and more accessible with AirLocal.**

Let's make device-to-device sharing work for everyone, everywhere.
