# 🛠️ VS Code & Local Tooling

Developer tooling is consolidated here so the `.vscode` folder can stay configuration-only. The Jest and Playwright split has been verified during the final testing pass.

## Jest in VS Code
- The workspace targets **unit tests only** through `jest.config.cjs`, limiting `testMatch` to `src/**` and `app/**` so Playwright specs are ignored. 【F:app-next-directory/jest.config.cjs†L1-L24】
- `.vscode/settings.json` points `jest.jestCommandLine` to `scripts/jest-vscode.sh`, which strips temporary runner arguments that previously triggered “No tests found” errors. 【F:app-next-directory/scripts/jest-vscode.sh†L1-L40】
- Use the **“On Demand”** mode in the VS Code Jest extension to run individual files without starting Playwright. 【F:app-next-directory/.vscode/settings.json†L1-L24】

## Test Directories
- **Unit tests**: `src/**/__tests__`, `app/**/__tests__` (Jest). 【F:app-next-directory/src/components/__tests__/CommentForm.test.tsx†L1-L30】
- **Integration & E2E**: `tests/e2e/**` (Playwright) with dedicated commands (`pnpm test:e2e`). 【F:app-next-directory/package.json†L22-L43】

The current setup was exercised as part of the final verification cycle; running `pnpm test:unit` and the VS Code test runner produces consistent results without cross-triggering Playwright suites.
