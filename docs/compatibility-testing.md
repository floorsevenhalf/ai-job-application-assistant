# Compatibility Testing Guide

Use only anonymous identifiers and reconstructed observations. Never store accounts, URLs containing tokens, names, phone numbers, email addresses, identity numbers, real schools, addresses, profile values, screenshots with personal data, or copied proprietary page HTML.

## Manual record template

```text
Site ID: SITE-001
Site category: ats
Page: Basic Info
Fields: 12
Scanner detected: 11 / 12
Matcher: 9 matched / 1 ambiguous / 1 unmatched
Correct: 9
Autofill: 8 filled / 1 custom select unsupported
Failure types:
- custom_select_unsupported
- scanner_context_incomplete
Notes: The page uses a reconstructed custom searchable select pattern.
```

## Procedure

1. Use a fictional local profile.
2. Record counts and stable `FailureCategory` codes, not personal field values.
3. Reduce a failure to the smallest original fixture; remove branding and copyrighted page content.
4. Confirm the fixture cannot identify a company or user.
5. Run `pnpm evaluate`, `pnpm privacy:check`, and tests before committing.

Company names are optional and should normally be replaced with `SITE-NNN` in a public repository. Do not automatically scrape recruiting pages.