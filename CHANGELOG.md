# Changelog

All notable changes are documented here. This project follows Keep a Changelog principles and intends to use Semantic Versioning after V1.0.

## [1.0.0-rc.1] - 2026-08-31

### Added

- Manifest V3 Chrome extension with React Popup and Options pages
- Local Zod-validated UserProfile storage
- Serializable DOM Scanner with bounded context and stable group identity
- Explainable Rule Matcher with confidence, evidence, negative vetoes, and section context
- Safe matched-only Autofill for native text, select, date, and radio controls
- Existing-value protection, delayed verification, session invalidation, highlight, and Undo
- Provider-independent optional Semantic Matcher and Hybrid Safety Gate
- Privacy preview, local AI settings, memory cache, timeout, and Fake Provider tests
- Compatibility fixtures, evaluation runner, confidence buckets, ablation and threshold reports
- Playwright extension E2E, privacy checks, GitHub Actions, public governance documents, and release demo

### Security

- Never auto-submit
- AI disabled by default and AI suggestions unchecked by default
- No production remote AI Provider bundled
- No telemetry, backend, or Profile upload

### Known limitations

- Native controls only; custom selects, cascades, iframe, Shadow DOM, and contenteditable require future adapters
- Compatibility dataset is finite and synthetic
- Fake Provider metrics validate pipeline behavior, not real LLM quality
