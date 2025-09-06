# BrowserStack Automate + Percy setup (Playwright)

This document explains how to configure BrowserStack Automate for Playwright and enable Percy visual tests for the `app-next-directory` Playwright test suite.

What I added in the repo:

- `app-next-directory/playwright.browserstack.config.ts` — example Playwright config that connects to BrowserStack using the WebSocket endpoint. Fill your BrowserStack caps as needed.
- `app-next-directory/tests/visual/example.percy.spec.ts` — a tiny Percy visual test example.

Manual steps you must take (summary):

1. Install Percy and BrowserStack packages in the `app-next-directory` workspace:

```powershell
# Percy dependencies should only be in devDependencies
pnpm --filter app-next-directory add -D @percy/cli @percy/playwright
# optionally add BrowserStack helper if desired  
pnpm --filter app-next-directory add -D @browserstack/playwright
pnpm --filter app-next-directory add -D @browserstack/playwright
```

2. Add environment variables to your environment or CI:

- `PERCY_TOKEN` — Percy project token (required to upload snapshots)
- `BROWSERSTACK_USERNAME` — BrowserStack username
- `BROWSERSTACK_ACCESS_KEY` — BrowserStack access key
- `BROWSERSTACK_BUILD_NAME` — optional friendly build name
- `BROWSERSTACK_PROJECT_NAME` — optional

On CI (GitHub Actions) add them as repository secrets and reference in your workflow.

3. To run Percy visual tests locally (after installing deps and starting the app):

```powershell
# Start app (from repo root)
pnpm --filter app-next-directory dev
# In another shell, run percy + playwright tests using the defined script
pnpm --filter app-next-directory test:visualvisual --project=chromium
```

4. To run tests on BrowserStack (example):

- Use `playwright.browserstack.config.ts` (or `playwright.config.ts` variants) and set `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` in CI.
- Example invocation (after setting env vars):

```powershell
cd app-next-directory
pnpm exec playwright test --config=playwright.browserstack.config.ts
```

Notes and tips
- Percy snapshots are uploaded to Percy service; ensure `PERCY_TOKEN` is set.
- BrowserStack Playwright integration often uses a websocket endpoint (`wss://cdp.browserstack.com/playwright`) and JSON capabilities (caps). The sample config shows how to wire that.
- If you want Percy snapshots from BrowserStack runs, run Percy locally (exec) or upload snapshots during CI. Some BrowserStack setups require capturing screenshots and then uploading; verify Percy usage in CI.

If you'd like, I can:
- Add `@percy/*` to `app-next-directory/package.json` directly and run `pnpm install` (requires terminal access), or
- Create a GitHub Actions workflow snippet to run Playwright on BrowserStack + Percy in CI.

---
