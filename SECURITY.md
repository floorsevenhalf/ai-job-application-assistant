# Security Policy

## Supported version

The V1.0 release-candidate branch is currently supported for security fixes. No compatibility or security guarantee is provided for older experimental snapshots.

## Reporting a vulnerability

Use GitHub Private Vulnerability Reporting / Security Advisories for this repository. Do not open a public issue for a vulnerability that could expose profile data, extension credentials, unsafe DOM writes, submission behavior, or recruiting-site accounts.

Include only:

- affected version or commit
- minimal reproduction using fictional data
- expected and observed security boundary
- browser and operating-system version

Never include a real name, phone number, email, address, application content, API key, session cookie, recruiting account, or copied private webpage HTML.

## Security boundaries

Security reports are especially relevant when they concern:

- Profile data leaving local storage unexpectedly
- Sensitive values entering SemanticMatchInput, logs, cache keys, fixtures, or reports
- A negative veto being bypassed
- Autofill targeting an excluded or stale field
- Existing-value protection or Undo corrupting user input
- Any automatic submit/apply behavior
- Extension permission expansion without justification

The project does not promise compatibility with every website and intentionally fails closed for unsupported components.