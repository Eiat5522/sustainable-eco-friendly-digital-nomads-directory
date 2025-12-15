# 🎨 Next.js Workspace Documentation

This folder centralizes documentation for the `app-next-directory` workspace after consolidating legacy notes. Use it as the source of truth for architecture, routing, data infrastructure, and authentication details now that the testing phase has wrapped successfully.

## 📂 Documentation Index
| Topic | File |
|-------|------|
| Architecture overview, data flow, and module map | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Page and API routing reference | [`ROUTING.md`](ROUTING.md) |
| MongoDB & Redis configuration (data infrastructure) | [`DATA-INFRASTRUCTURE.md`](DATA-INFRASTRUCTURE.md) |
| Structured logging and observability | [`LOGGING.md`](LOGGING.md) |
| Authentication & account APIs | [`AUTHENTICATION.md`](AUTHENTICATION.md) |
| REST endpoint catalog | [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) |
| Component system overview | [`COMPONENTS.md`](COMPONENTS.md) |
| VS Code & local tooling | [`IDE_GUIDE.md`](IDE_GUIDE.md) |
| Testing strategy (Playwright & Jest) | [`TESTING.md`](TESTING.md) |

## 🚀 Quick Links
- Workspace README & scripts: [`../../app-next-directory/README.md`](../../app-next-directory/README.md)
- Package manifest and commands: [`../../app-next-directory/package.json`](../../app-next-directory/package.json)
- Playwright suites: [`../../app-next-directory/tests/e2e/`](../../app-next-directory/tests/e2e/)
- Jest unit tests: [`../../app-next-directory/src`](../../app-next-directory/src)

## ✅ Testing Status
All unit, integration, and E2E suites are green (`pnpm test:unit`, `pnpm test:e2e`, `pnpm lint`, `pnpm check-types`). Refer to the individual documents above for deeper coverage notes and file-level references.
