# 30–60 Second Demo Recording

The demo uses only fictional data. Before recording, build and load the unpacked extension, then start the local fixture server:

```bash
corepack pnpm build
corepack pnpm dev --host 127.0.0.1
```

Open `http://127.0.0.1:5173/examples/forms/release-demo.html` and pin the extension.

## Suggested recording sequence

1. **0–6s:** Briefly show Options with the fictional profile. Keep AI disabled and show the local-only notice.
2. **6–14s:** Open the release demo form. Point out the prefilled email, agreement checkbox, and untouched Submit button.
3. **14–23s:** Open Popup and click **扫描当前页面**. Show detected fields, Rule paths, confidence/status, and the ambiguous `College` field.
4. **23–31s:** Show Human Review: matched Rule fields are checked, ambiguous is disabled/unselected, and the existing email is protected.
5. **31–40s:** Click **填充已确认字段**. Show name, phone, school, major, degree, and gender filled; email remains unchanged.
6. **40–47s:** Show agreement checkbox still unchecked and Submit count still `0`—the extension never submits.
7. **47–55s:** Click **撤销本次填充** and show filled fields restored while the original email remains.
8. **55–60s:** End on the Privacy-first / Human-in-the-loop / Never auto-submit message.

Do not type real personal data, expose an API key, open a real recruiting account, or record browser history/bookmarks containing private information.