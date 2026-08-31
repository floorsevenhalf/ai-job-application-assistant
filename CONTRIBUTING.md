# Contributing

Thank you for helping improve AI Job Application Assistant. Contributions should preserve its privacy-first, local-first, rule-first, human-in-the-loop design.

## Setup

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm exec playwright install chromium
```

## Before opening a pull request

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm privacy:check
corepack pnpm evaluate
corepack pnpm evaluate:ai
corepack pnpm e2e
```

## Pull-request expectations

- Explain the problem, safety impact, and tests.
- Keep Scanner, Matcher, Semantic Matcher, Autofill, and site-specific logic separated.
- Put website compatibility behavior behind `SiteAdapter` contracts.
- Add minimized, reconstructed fixtures rather than copied website pages.
- Do not commit real profile values, accounts, screenshots, cookies, tokens, API keys, or private URLs.
- Treat false-positive autofill as higher risk than a false negative.
- Do not weaken negative vetoes, human review, existing-value protection, or submission boundaries without an explicit security discussion.
- Regenerate reports when evaluation inputs or algorithms change.

## Scope

Welcome contributions include tests, accessibility, documentation, safe field rules, compatibility fixtures, adapters for unsupported controls, and browser compatibility work.

Automatic submission, bulk applications, automatic apply-button clicking, bypassing consent, and recruiting-site security circumvention are out of scope.

## Commit and release hygiene

Use focused commits and avoid generated local artifacts. Update `CHANGELOG.md` for user-visible changes. Maintainers should complete [docs/release-checklist.md](docs/release-checklist.md) before tagging.