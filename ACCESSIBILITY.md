# Accessibility

AirLocal aims to make file sharing simple and accessible to everyone, regardless of their device, abilities, or preferred way of interacting with technology.

Accessibility is part of building a tool that people can use independently and confidently. This document explains our accessibility priorities, expectations for contributors, and how to report barriers.

We welcome accessibility feedback from users, contributors, and anyone who encounters difficulty using AirLocal. You do not need to disclose a disability or provide medical information to report an issue.

## Priorities

Our goal is to make the essential file-sharing experience understandable, usable, and accessible across supported devices and browsers.

We prioritize the following areas:

- **Keyboard navigation:** Users should be able to navigate the interface, select files, initiate transfers, and access important controls without requiring a mouse.
- **Screen reader support:** Interactive elements, buttons, form fields, connection states, and transfer progress should have meaningful names and understandable announcements.
- **Visual accessibility:** Text should remain readable, controls should have sufficient contrast, and information should not depend on color alone.
- **Clear feedback:** Users should be able to understand when a device is connecting, a transfer is in progress, a file has been received, or an operation has failed.
- **Responsive design:** The interface should remain usable on smaller screens, different viewport sizes, and varying zoom levels.
- **Understandable language:** Instructions, errors, and status messages should use clear, concise language and avoid unnecessary technical jargon.
- **Accessible file selection:** File selection, transfer confirmation, cancellation, and other essential actions should have clear labels and predictable behavior.
- **Reduced motion:** Where animations are used, the interface should respect users' reduced-motion preferences whenever practical.

We aim to work toward the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA as an aspirational target. This is a development goal, not a claim of verified conformance.

## Contributor expectations

Accessibility is a shared responsibility. All contributors should consider accessibility when adding features, changing layouts, or modifying interactions.

### Interface and interaction

- Use semantic HTML elements wherever possible.
- Provide accessible names for buttons, links, inputs, and other interactive controls.
- Ensure interactive elements can be operated using a keyboard.
- Keep keyboard focus visible and make focus order predictable.
- Avoid keyboard traps.
- Use appropriate labels and instructions for form fields and file-selection controls.
- Communicate connection status, transfer progress, completion, and errors in a way that assistive technologies can access.
- Ensure dialogs, menus, and other interactive components manage focus appropriately.
- Do not rely exclusively on color, animation, sound, or visual position to communicate important information.

### Visual design

- Maintain sufficient text and interface contrast.
- Support browser zoom and responsive layouts without hiding essential controls.
- Avoid excessively small text and difficult-to-use touch targets.
- Provide visible focus indicators.
- Respect reduced-motion preferences and avoid unnecessary flashing or distracting animations.
- Ensure content remains understandable in both light and dark themes, where applicable.

### File transfers and device discovery

AirLocal relies on users understanding the state of a connection and the files they are sharing. Contributors should ensure that:

- Connection and transfer states are communicated clearly.
- Errors include useful explanations and, where possible, recovery steps.
- File names and transfer actions are distinguishable to screen reader users.
- Users can identify which transfer has completed, failed, or been cancelled.
- Essential functionality does not depend solely on drag-and-drop gestures.
- Timeouts and connection failures do not leave users without understandable feedback.

### Testing and documentation

For user-facing changes, contributors should:

1. Test keyboard navigation and visible focus.
2. Check relevant layouts at mobile and desktop sizes.
3. Verify that labels and status messages are understandable.
4. Test with a screen reader when the change affects an important interaction, where feasible.
5. Document known accessibility limitations and any necessary workarounds.

Automated accessibility checks can help identify common problems, but they do not replace manual testing with a keyboard or assistive technology.

When submitting a pull request that changes the interface, include a short accessibility testing note describing what you checked and any known limitations.

## Reporting accessibility issues

If you encounter a barrier while using AirLocal, please report it through the repository's GitHub Issues:

https://github.com/pulkitpareek18/AirLocal/issues

Use a descriptive title, such as `Accessibility: transfer status is not announced to screen readers`.

If you cannot use the issue tracker because of the barrier itself, contact the repository maintainer through GitHub to request an alternative reporting method.

You may include any of the following details that are relevant:

- **Affected task:** What were you trying to do?
- **Page or URL:** Where did the problem occur?
- **Observed behavior:** What happened, and what did you expect?
- **Environment:** Browser, operating system, and device.
- **Input method:** Keyboard, mouse, touch, switch device, or another method.
- **Assistive technology:** Screen reader, magnification software, voice control, or another tool, if applicable.
- **Workaround:** Whether you found another way to complete the task.

Screenshots, recordings, and additional technical details are optional. Please remove personal information and private file details before sharing them.

You do not need to identify a specific accessibility standard or explain why the issue affects you.

### Severity

Maintainers may assign a severity level based on how strongly a barrier affects users' ability to complete important tasks.

| Severity | Description | Example |
|---|---|---|
| Critical | An essential task is impossible for affected users, with no practical workaround. | A keyboard user cannot initiate or complete a file transfer. |
| High | A major task is significantly impaired, and the available workaround is difficult or unreliable. | A screen reader cannot identify the files available for transfer. |
| Medium | A task remains possible, but a barrier causes significant confusion or extra effort. | Transfer progress is difficult to distinguish from other status messages. |
| Low | A minor usability issue or improvement opportunity. | A nonessential icon has an unclear accessible name. |

These examples are guidance, not rigid classifications. Maintainers will assess the impact and prioritize issues accordingly. Reporters do not need to assign a severity level.

### How we respond

We aim to handle accessibility reports respectfully and transparently.

- We will review reports and request clarification when necessary.
- We will acknowledge reports and provide updates as maintainers' availability permits.
- We will assess the impact on essential tasks and prioritize accordingly.
- Where possible, we will suggest temporary workarounds while a fix is being developed.
- When a fix is available, we welcome feedback from the reporter to help verify that the barrier has been resolved.

Response and resolution times may vary depending on severity, complexity, and maintainer availability. We do not currently guarantee fixed response deadlines.

## Ownership and maintenance

The AirLocal project maintainers are responsible for incorporating accessibility into project decisions, reviewing reported barriers, and encouraging accessible contributions.

Accessibility should be considered during feature planning, code review, and testing, rather than treated solely as a post-release task.

This document should be reviewed periodically and updated when the project's accessibility practices, supported environments, or known limitations change.

If accessibility responsibilities transfer to new maintainers, ownership of this policy should transfer with the project's maintenance responsibilities.

## Supported environments

AirLocal is intended to work in modern browsers across desktop and mobile devices.

The project aims to support a range of interaction methods, including:

- Keyboard and mouse.
- Touchscreens.
- Browser zoom and text scaling.
- Screen readers and other assistive technologies where supported by the browser.

Actual accessibility can vary by browser, operating system, device, and assistive technology combination.

Specific combinations should be listed as tested only after verification. Contributors are encouraged to report compatibility problems and share their testing environment when possible.

## Known limitations

AirLocal's accessibility is an ongoing effort. We do not currently claim that every workflow has been evaluated against WCAG 2.2 Level AA.

Potential areas requiring evaluation include:

- Whether connection and transfer status changes are announced reliably by screen readers.
- Whether every essential control is reachable and operable using only a keyboard.
- Whether focus is managed correctly in dialogs and file-selection workflows.
- Whether text and interface elements maintain sufficient contrast across themes.
- Whether all transfer errors provide understandable recovery instructions.
- Whether the complete file-sharing workflow is usable with mobile assistive technologies.

These are areas to evaluate, not assertions that each issue currently exists.

Until an area has been tested, its accessibility should be considered unverified. Confirmed barriers should be tracked through GitHub Issues, along with available workarounds where appropriate.

## Feedback and improvements

We welcome suggestions for improving this policy and AirLocal's accessibility practices.

You can propose documentation changes through a pull request or open a GitHub issue to discuss improvements to accessibility testing, contributor guidance, and supported environments.

If you encounter an active barrier that prevents you from using AirLocal, please follow the [reporting accessibility issues](#reporting-accessibility-issues) process above.

Our goal is continuous improvement: making AirLocal easier to understand, navigate, and use for everyone.
