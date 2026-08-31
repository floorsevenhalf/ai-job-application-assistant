# Privacy Policy and Data Handling

AI Job Application Assistant is designed as a local-first browser extension.

## Stored locally

- UserProfile fields entered in Options
- Optional AI enablement, Provider ID, and API Key settings
- Chrome stores these values in `chrome.storage.local`

The project does not provide browser sync, a backend database, telemetry, or user accounts.

## DOM processing

The content script reads supported form controls on the active page only after the user initiates a scan. Live DOM references remain in the content-script scan session and are not serialized. Field descriptors contain bounded structural text, not page HTML.

## Optional semantic fallback

AI is disabled by default. The repository bundles no production remote Provider. A future user-installed Provider may receive only the displayed `SemanticMatchInput` after explicit confirmation. That input excludes UserProfile values and current field values. Rule negative vetoes and the Hybrid Safety Gate still apply.

Optional API keys are stored locally, hidden in the Options UI, and excluded from logs, fixtures, reports, and source control.

## Public repository data

Examples, tests, evaluation fixtures, and reports must contain only fictional or sanitized data. Contributors must run:

```bash
corepack pnpm privacy:check
```

The check is a defense-in-depth pattern scanner, not a guarantee that arbitrary data is safe. Human review remains required.

## Never collected

The project has no mechanism for collecting analytics, application submissions, resumes, recruiting credentials, browsing history, or Profile values on a project server.

## User control

Users can edit or remove local profile and AI settings through browser extension storage controls or by removing the extension. Autofill never submits a form, and successful writes can be conditionally undone during the active content-script session.