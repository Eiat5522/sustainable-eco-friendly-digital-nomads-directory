# 📝 Sanity Workspace Documentation

Welcome to the consolidated documentation for the `sanity` workspace. These files capture the studio architecture, schema definitions, and upgrade notes after moving everything into the centralized docs directory.

## 📂 Documentation Index
| Topic | File |
|-------|------|
| Studio architecture, plugins, and integration notes | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Detailed schema reference | [`SCHEMA_GUIDE.md`](SCHEMA_GUIDE.md) |
| Recent upgrade summary (Node & package updates) | [`UPDATES_SUMMARY.md`](UPDATES_SUMMARY.md) |

## 🚀 Quick Start
```bash
cd sanity
pnpm install
pnpm dev # http://localhost:3333
```

- **Project configuration**: [`sanity.config.js`](../../sanity/sanity.config.js)
- **Schema entry point**: [`sanity/schemas/index.js`](../../sanity/schemas/index.js)
- **Type generation**: `pnpm update-types`

## ✅ Testing & Verification
The studio does not ship automated tests; run `pnpm lint` after schema changes and regenerate types for the Next.js workspace (`pnpm update-types`). Both steps were completed during the final testing cycle to ensure compatibility. 【F:sanity/package.json†L11-L22】
