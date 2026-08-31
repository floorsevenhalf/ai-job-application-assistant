# AI Job Application Assistant v1.0.0-rc.1

First public release candidate.

## Highlights

- DOM-based form scanning
- Explainable rule-based field matching
- Confidence ranking and negative veto
- Section-context-aware matching
- Human-reviewed safe autofill
- Existing-value protection
- Undo support
- Stale scan-session protection
- Optional rule-first AI semantic fallback architecture
- Privacy-first local storage
- Offline evaluation
- Automated CI and privacy checks

## Evaluation

Rule Matcher results on the current limited sanitized compatibility dataset:

- Precision: 100.0%
- Recall: 69.7%
- F1: 82.1%

These results are based on a limited sanitized compatibility dataset and should not be interpreted as representative of all recruitment websites.

## AI Notice

The bundled Scripted Fake Provider is only used to validate the Hybrid Matcher pipeline. It does not represent real LLM performance, and no production remote AI provider is bundled in this release.

## Safety

- Never auto-submits job applications
- AI is disabled by default
- AI suggestions require explicit user confirmation
- Existing page values are protected by default
- Sensitive Profile values are not included in semantic AI input
- No backend or telemetry is included

## Testing

- Vitest: 141/141
- Playwright E2E: 3/3
- Total automated tests: 144/144
