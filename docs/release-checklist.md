# V1.0 Release Checklist

## Functionality

- [ ] Scan → Rule Match → Human Review → Safe Autofill works on the release demo
- [ ] Existing values remain protected by default
- [ ] Undo restores only unchanged autofilled values
- [ ] AI is disabled by default and suggestions remain unchecked
- [ ] Submit and consent controls remain untouched

## Testing

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm evaluate`
- [ ] `pnpm evaluate:ai`
- [ ] `pnpm e2e`
- [ ] GitHub Actions passes on the release commit

## Privacy

- [ ] `pnpm privacy:check`
- [ ] Git history reviewed for personal data and secrets
- [ ] Examples and Demo contain fictional data only
- [ ] Evaluation reports contain no Profile values
- [ ] No API key, token, private URL, account, or session data is committed

## Documentation

- [ ] README sections and links reviewed
- [ ] Architecture, Evaluation, Privacy, Security, Contributing, Changelog, and Roadmap reviewed
- [ ] Fake Provider metrics clearly labeled as pipeline validation
- [ ] Version and compatibility limitations are consistent

## Demo

- [ ] Follow `docs/demo.md` from a clean browser profile
- [ ] Record 30–60 second GIF/video without private browser chrome or data
- [ ] Verify Submit count remains zero
- [ ] Add compressed release media and alt text if publishing it

## GitHub

- [ ] Replace `OWNER/REPOSITORY` placeholders after creating the remote
- [ ] Add repository description and topics
- [ ] Enable private vulnerability reporting
- [ ] Protect the default branch and require CI
- [ ] Review Dependabot and permission settings
- [ ] Confirm `dist`, local profiles, reports with private data, and test artifacts are ignored as intended

## Release tag

- [ ] Commit the reviewed RC tree
- [ ] Confirm a clean working tree
- [ ] Create signed/annotated tag `v1.0.0-rc.1`
- [ ] Push commit and tag
- [ ] Confirm remote CI
- [ ] Publish release notes from `CHANGELOG.md`
- [ ] Do not tag `v1.0.0` until RC feedback is resolved