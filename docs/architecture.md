# Architecture

## Data flow

```text
UserProfile (local-only)
        ↓ resolve value only after user confirmation
DOM Scanner ── temporary fieldId → HTMLElement map stays in content script
        ↓
FieldDescriptor (serializable, no DOM references)
        ↓
Rule Matcher (primary, deterministic, explainable)
        ↓ ambiguous/unmatched only
Optional AI Semantic Fallback (sanitized structure only)
        ↓
Hybrid Safety Gate (allowed paths, confidence, margin, negative veto)
        ↓
Human Review (AI suggestions unchecked by default)
        ↓
Safe Autofill (live DOM revalidation, no overwrite by default, never submit)
```

## Layer responsibilities

### UserProfile and storage

`UserProfile` is validated with Zod and stored in `chrome.storage.local`. Profile resolution, including the logical highest-education path, is centralized in the Profile Resolver. Profile values never enter scanner descriptors, compatibility reports, SemanticMatchInput, cache keys, or telemetry—there is no telemetry.

### DOM Scanner

The content script scans supported native controls and extracts bounded labels, ARIA text, attributes, local context, options, group identity, visibility, and safety state. It excludes unsafe or unsupported inputs. A scan-session map holds live DOM elements; descriptors remain plain serializable objects.

### Rule Matcher

The Rule Matcher ranks all supported ProfileFieldPaths using configurable source weights, type evidence, option evidence, and negative evidence. Strong negative vetoes prevent dangerous mappings such as recommender contact details to the applicant profile. Existing Rule Matcher behavior is the default production path.

### Optional Semantic Fallback

The Semantic Matcher is a Provider-independent interface. It is eligible only for ambiguous or unmatched scanner-supported fields, is disabled by default, and receives a sanitized descriptor—not UserProfile values. The repository includes a Fake Provider for testing but no production remote Provider.

### Hybrid Safety Gate

The gate validates structured output, allowed paths, a 0.90 initial threshold, a 0.15 Top-1 margin, and Rule vetoes. Provider errors, malformed output, timeouts, or missing configuration return the original Rule result. AI confidence is treated as a score, not a calibrated probability.

### Human Review

Rule matches are selected by default. AI matches are visibly marked and remain unchecked until the user explicitly accepts them. The privacy preview appears before an AI fallback run.

### Safe Autofill

Autofill resolves Profile values only after review, rechecks the current DOM, rejects stale scan sessions, preserves existing values by default, uses native setters and bubbling events, verifies writes twice, and supports conditional Undo. It never clicks or invokes a submit control.

## Extension boundaries

- Popup: orchestration, review, selection, and local status presentation
- Options: local Profile and optional Provider settings
- Content script: DOM ownership, scan sessions, filling, Undo, mutation invalidation
- Core: framework-independent scanner, matcher, semantic contracts, safety, evaluation, and autofill logic
- Site adapters: future isolated compatibility hooks; no real-site adapters are bundled

## Trust boundaries

1. Webpage DOM is untrusted and may change after scanning.
2. Provider output is untrusted and must pass strict parsing and the Safety Gate.
3. User Profile is sensitive and remains local until a user-confirmed DOM write.
4. Evaluation fixtures and reports are public artifacts and must remain sanitized.
5. Submission is always outside extension control.