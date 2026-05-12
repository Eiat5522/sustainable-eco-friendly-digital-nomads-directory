# app-next-directory – Next.js Frontend

This workspace hosts the Next.js 15 App Router frontend for the Sustainable Eco-Friendly Digital Nomads Directory. It consumes Sanity content, MongoDB collections, and Redis-backed services to power listings, search, authenticated dashboards, and the ChatGPT App `/mcp` route.

The standalone MCP-App widget server lives separately in [`../mcp-apps-server/`](../mcp-apps-server/); do not treat this workspace and the standalone server as the same runtime.

## Current Status (Q1 2025)

- ✅ **Core experience online** – Home, search, listing detail, and dashboard shells are implemented with live data hooks and loading states.
- ✅ **Auth-first routing** – NextAuth.js v5 flows guard dashboards, while role-aware layouts power editor/admin surfaces.
- ✅ **Design system stabilized** – Component library in `src/components/` now drives all new UI work with Tailwind v4 tokens.
- 🔄 **In progress** – Advanced search facets and result ranking are being tuned alongside analytics instrumentation.

Track upcoming milestones in [`docs/reference/CHANGELOG.md`](../docs/reference/CHANGELOG.md).

## Getting Started
```bash
pnpm install
pnpm dev       # http://localhost:3000
pnpm lint      # ESLint + TypeScript checks
pnpm test:unit # Jest unit tests
pnpm test:e2e  # Playwright end-to-end suites
```

Key directories:
- `app/` – App Router pages, layouts, and API route handlers. 【F:app-next-directory/app/dashboard/page.tsx†L1-L34】
- `app/mcp/` – Next.js-hosted ChatGPT App MCP endpoint. 【F:app-next-directory/app/mcp/route.ts†L1-L62】
- `src/components/` – UI system, domain components, and co-located tests. 【F:app-next-directory/src/components/listings/ListingDetailView.tsx†L1-L36】
- `src/lib/` – Integrations (Sanity, MongoDB, Redis), DTO transformers, and analytics services. 【F:app-next-directory/src/lib/sanity/client.ts†L1-L28】【F:app-next-directory/src/lib/dbConnect.ts†L1-L34】
- `src/models/` – Mongoose models with comprehensive Jest coverage. 【F:app-next-directory/src/models/User.ts†L1-L43】

## Code Quality & Linting

This project maintains high code quality through a comprehensive linting and formatting setup using **ESLint**, **Prettier**, and **Biome**. The configuration ensures consistent code style, catches potential bugs, and enforces TypeScript best practices.

### Linting Tools

- **ESLint**: JavaScript/TypeScript linting with React and Next.js rules
- **Prettier**: Code formatting for consistent style
- **Biome**: Additional linting and formatting checks
- **TypeScript**: Type checking via `tsc --noEmit`

### Development Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **VSCode Extensions**
   - ESLint, Prettier, and Biome extensions are recommended in workspace settings
   - Extensions provide real-time linting and auto-fix capabilities

3. **Run Linting Commands**
   ```bash
   pnpm lint          # Run ESLint (includes auto-fixes)
   pnpm lint:strict   # Run ESLint with zero warnings allowed
   pnpm format        # Run Biome formatting (writes changes)
   pnpm format:check  # Check formatting without changes
   pnpm lint:biome    # Run Biome linting
   pnpm type-check    # Run TypeScript type checking
   ```

### Automated Quality Checks

- **Pre-commit Hooks**: Husky runs linting on staged files before commits
- **Lint-staged**: Automatically fixes and formats only changed files
- **CI/CD**: GitHub Actions run comprehensive linting on every push/PR
- **IDE Integration**: VSCode provides real-time feedback and auto-fixes

### Configuration Files

- `eslint.config.mjs` - ESLint rules and configurations
- `.prettierrc` - Prettier formatting options
- `.lintstagedrc.json` - Lint-staged file patterns
- `package.json` - Linting scripts and dependencies

### Best Practices

- Commit messages trigger pre-commit hooks that may block commits with lint violations
- Use `pnpm lint --fix` to auto-resolve most issues
- Run `pnpm format` before committing to ensure consistent formatting
- CI will fail if any linting issues are found in pull requests

## Documentation

- Workspace documentation lives under [`docs/app-next-directory/`](../docs/app-next-directory/).
- Cross-workspace references (changelog, workspace setup, troubleshooting) are available in [`docs/reference/`](../docs/reference/).
- See [`docs/app-next-directory/README.md`](../docs/app-next-directory/README.md) for navigation, roadmap highlights, and design guidelines.
- **Email Configuration**: See [`docs/EMAIL_CONFIGURATION.md`](docs/EMAIL_CONFIGURATION.md) for setting up contact form email notifications.

## Testing & Quality

Latest verification: `pnpm lint`, `pnpm check-types`, `pnpm test:unit`, and `pnpm test:e2e` (Q1 2025 cycle). For tooling details and test matrices, read [`docs/app-next-directory/TESTING.md`](../docs/app-next-directory/TESTING.md).

### Console Noise Suppression

By default, **intentional test errors** (simulated DB failures, validation errors, expected test warnings) are filtered from console output to improve readability and reduce cognitive load during testing. 

**What gets filtered:**
- Intentional API errors (e.g., "Search GET error:", "MongoDB Connection Error:")
- Expected authentication/auth errors during tests
- React testing environment warnings (act(...) configuration)
- JSDOM "not implemented" warnings (navigation, form submit, etc.)
- Test-specific component errors (e.g., "Failed to load test listings")

**What is NOT filtered (real issues that you should see):**
- Real JavaScript errors (TypeError, ReferenceError, SyntaxError)
- React code quality warnings (controlled/uncontrolled inputs, invalid props)
- Unexpected errors with patterns not in the filter list
- Legitimate warnings about code issues

**To see all console output for debugging:**

```bash
JEST_CONSOLE_NO_FILTER=1 pnpm test:unit
```

The filtering mechanism is configured in `jest.setup.ts`. The filters use specific string patterns to match only intentional test noise. For example, `'An update to'` alone won't suppress - it requires BOTH `'An update to'` AND `'inside a test was not wrapped in act'` to match the pattern.

## Dependencies & Compatibility

### NextAuth.js v5 Beta
This project uses **NextAuth.js v5.0.0-beta.30** to take advantage of the latest authentication features and improved App Router integration. The beta version is stable for production use, but be aware:
- We're monitoring the [NextAuth.js v5 release roadmap](https://github.com/nextauthjs/next-auth/discussions) for the stable GA release
- The current beta has been thoroughly tested with our authentication flows
- Migration path to stable v5 will be minimal once released
- Alternative: Consider NextAuth.js v4.x if you require only stable releases

### Tailwind CSS
Tailwind CSS v4.x is installed as a **devDependency only** (not in dependencies) as it's a build-time tool that processes styles during the build phase. This reduces install time and keeps the production bundle clean.
