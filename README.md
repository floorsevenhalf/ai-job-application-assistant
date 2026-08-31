# AI Job Application Assistant

> Privacy-first · Local-first · Rule-first · AI optional · Human-in-the-loop · Never auto-submit

AI Job Application Assistant is a Chrome Manifest V3 extension for reducing repetitive data entry on job-application forms. It scans standard form controls, maps them to a locally stored profile with explainable rules, lets the user review every suggestion, and fills only explicitly confirmed fields.

The project is a V1.0 release candidate intended for open-source review, portfolio presentation, and safe local demonstrations. It does not submit applications or automate application decisions.

## Project Introduction

The extension separates DOM scanning, semantic matching, safety policy, user review, and DOM writing into independently tested modules. Personal profile data remains in `chrome.storage.local`; serializable field descriptors cross the extension boundary, while DOM references remain inside the content script.

## Motivation

Job seekers repeatedly enter the same contact and education details across unrelated forms. Existing automation can be opaque or overly aggressive. This project explores a safer alternative: deterministic matching first, conservative fallbacks, visible evidence, explicit confirmation, and no final submission automation.

## Demo

The release demo contains standard fields, an ambiguous field, an existing value, a consent checkbox, and a submit button:

```bash
corepack pnpm dev --host 127.0.0.1
```

Open `http://127.0.0.1:5173/examples/forms/release-demo.html` and follow [docs/demo.md](docs/demo.md). All demo values are fictional. No GIF is committed yet; the recording script is ready for a future release asset.

## Key Features

- Chrome Manifest V3, TypeScript, Vite, and React
- Local UserProfile storage with Zod validation
- Bounded DOM scanning for native input, textarea, select, radio, and checkbox controls
- Serializable `FieldDescriptor` with labels, ARIA metadata, nearby text, options, groups, and section context
- Explainable Rule Matcher with confidence scores, Top-3 candidates, type/option evidence, and strong negative vetoes
- Matched-only safe autofill with native setters and React/Vue-compatible events
- Existing-value protection enabled by default
- Delayed write verification, stale-session rejection, temporary highlights, and one-session Undo
- Optional Hybrid Matcher with provider abstraction, sanitized preview, timeout, memory cache, and safety gate
- Local compatibility evaluation, confidence buckets, ablations, threshold experiments, and failure reports
- Browser-level Playwright tests against a controlled React form
- Privacy scanning and GitHub Actions quality gates

## Architecture

```text
UserProfile (chrome.storage.local)
              ↓
          DOM Scanner
              ↓
       FieldDescriptor
              ↓
         Rule Matcher
              ↓
    optional AI Semantic Fallback
              ↓
          Safety Gate
              ↓
         Human Review
              ↓
         Safe Autofill
```

Rule-matched fields are the primary path. AI is disabled by default and may only inspect sanitized structure for ambiguous/unmatched, scanner-supported fields. Strong rule vetoes cannot be overridden. See [docs/architecture.md](docs/architecture.md).

## How It Works

1. The user stores a profile locally in Options.
2. The Popup requests a scan of the active HTTP(S) page.
3. The content script extracts bounded, serializable field descriptors and retains temporary `fieldId → HTMLElement` references.
4. The Rule Matcher ranks supported ProfileFieldPaths and exposes evidence.
5. Optional AI fallback can run only after a privacy preview and explicit user action.
6. The Hybrid Safety Gate validates paths, confidence, margin, and negative vetoes.
7. The user reviews and selects fields. Rule matches are preselected; AI suggestions are not.
8. Autofill revalidates the live DOM, preserves existing values by default, writes selected fields, and never submits.
9. Undo restores only values that have not been manually changed since filling.

## Installation

Requirements: Node.js 22 and pnpm 9.15.5.

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
```

Then open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the generated `dist` directory.

## Usage

1. Open extension Options and enter a local profile.
2. Keep **AI semantic recognition** disabled for the deterministic rule-only path.
3. Open a normal HTTP(S) form and click **扫描当前页面**.
4. Review field path, status, confidence, evidence, and prepared value.
5. Optionally review the sanitized AI preview and explicitly run a registered Provider.
6. Deselect any Rule match you do not want; explicitly select any AI suggestion you accept.
7. Click **填充已确认字段**.
8. Check every value manually, use **撤销本次填充** if needed, and submit the page yourself.

## Evaluation

The finite compatibility dataset contains 38 synthetic, sanitized field cases; it is not representative of all recruitment sites.

Rule Matcher offline results:

| Metric | Result |
|---|---:|
| Scanner detection recall | 92.1% |
| Rule Matcher precision | 100.0% |
| Rule Matcher recall | 69.7% |
| Rule Matcher F1 | 82.1% |
| Wrong-match rate | 0.0% |

`pnpm evaluate:ai` uses a **Scripted Fake Provider** solely to validate Hybrid Matcher control flow and reporting. Its output is not real LLM performance and must not be used to claim AI quality. See [docs/evaluation.md](docs/evaluation.md) and [reports/ai/hybrid_evaluation.json](reports/ai/hybrid_evaluation.json).

## Privacy

- Profile and optional Provider credentials are stored only in `chrome.storage.local`.
- The repository contains only fictional profiles and reconstructed fixtures.
- No telemetry, backend database, remote sync, account system, or profile upload exists.
- Semantic input excludes Profile values, current field values, complete HTML, and account data.
- API keys are never logged, included in reports, fixtures, or source control.
- `pnpm privacy:check` scans repository files for common personal-data and secret patterns.

See [PRIVACY.md](PRIVACY.md).

## Safety Principles

- **Rule-first:** deterministic rules remain the primary matcher.
- **AI optional:** disabled by default; no production remote Provider is bundled.
- **Human-in-the-loop:** users review every match and explicitly accept AI suggestions.
- **Never auto-submit:** the extension does not click or invoke final submission controls.
- **Negative veto wins:** strong safety vetoes remove forbidden semantic paths before and after fallback.
- **Do not overwrite by default:** existing page content is preserved unless the user opts in.
- **Fail closed:** unsupported controls and uncertain results remain manual.
- **Recoverable:** stale sessions are rejected and successful fills can be undone safely.

## Development

```bash
corepack pnpm dev
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm privacy:check
corepack pnpm evaluate
corepack pnpm evaluate:ai
corepack pnpm exec playwright install chromium
corepack pnpm e2e
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes. Site-specific logic belongs behind the `SiteAdapter` interface rather than in Scanner/Matcher/Autofill core modules.

## Testing

- Vitest unit, integration, robustness, evaluation, and performance tests
- Playwright browser tests using an unpacked extension and controlled React page
- Large synthetic form benchmark with 325 DOM controls
- Privacy pattern scan
- Reproducible Rule and Hybrid pipeline evaluation scripts
- GitHub Actions runs lint, typecheck, tests, builds, evaluations, privacy checks, and Chromium E2E

## Roadmap

The release roadmap is maintained in [docs/roadmap.md](docs/roadmap.md). Planned areas include a real opt-in AI Provider, larger compatibility datasets, custom-select and cascading-location adapters, additional anonymous recruitment-site adapters, and Firefox/Edge compatibility.

Automatic submission, bulk application, automatic apply-button clicking, and bypassing human confirmation are explicitly out of scope.

## Security

Please report vulnerabilities privately according to [SECURITY.md](SECURITY.md). Do not include real profile data or active credentials in reports.

## License

Licensed under the [MIT License](LICENSE).