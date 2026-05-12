# Sustainable Eco-Friendly Digital Nomads Directory

A curated monorepo platform for sustainable, eco-friendly venues and services for digital nomads. Built with Next.js 16+, Sanity CMS, and modern authentication.

---

## 🏗️ Monorepo Architecture

```
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/   # Next.js frontend application
├── sanity/               # Sanity CMS configuration
├── mcp-apps-server/      # Standalone MCP Apps workday planner server
├── listings/             # Data migration scripts
├── docs/                 # Project documentation
├── memory-bank/          # Context, logs, and session files
└── tasks/                # Task management files
```

### 🛡️ Data Access Layer (DAL)

To optimize performance and security, we use a centralized Data Access Layer (DAL) for all content fetching:

- **Location**: [app-next-directory/src/lib/data-access/](app-next-directory/src/lib/data-access/)
- **Patterns**: Employs Next.js 16 `use cache` for static listing data and `use cache: private` for user-specific state.
- **PPR Integration**: Components like [UserFavoriteStatus.tsx](app-next-directory/src/components/favorites/UserFavoriteStatus.tsx) utilize the DAL within Suspense boundaries to enable efficient Partial Prerendering (PPR) of the listing detail pages.

---

## 🌱 Key Features

- **Curated Eco-Friendly Listings**: Verified venues, sustainability scores, certifications
- **Advanced Search & Filtering**: Full-text, geo, eco-tag, and digital nomad features
- **Authentication & User Management**: NextAuth.js, 5-tier RBAC, secure sessions
- **Admin Dashboard**: Analytics, moderation, bulk operations, user management
- **Interactive Maps**: Leaflet.js, OpenStreetMap, city carousel
- **Modern UI/UX**: Tailwind CSS, Framer Motion, accessible components
- **Testing & CI/CD**: Playwright, GitHub Actions, Vercel deployment
- **MCP Interfaces**: Next.js `/mcp` ChatGPT route plus a standalone `mcp-apps-server` workspace

## MCP Interfaces

- **ChatGPT App interface**: run `pnpm dev:chatgpt-app` and use `http://localhost:3000/mcp`
- **MCP-App interface**: run `PORT=3337 MCP_URL=http://127.0.0.1:3337 pnpm dev:mcp-apps` and use `http://127.0.0.1:3337/mcp`
- Keep them on separate ports so the Next.js ChatGPT route and standalone widget server stay isolated.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16+, TypeScript, Tailwind CSS, Framer Motion, Radix UI
- **Backend/CMS**: Sanity.io, MongoDB Atlas, NextAuth.js
- **Testing**: Playwright (E2E), Jest (unit), Zod (validation)
- **DevOps**: GitHub Actions, Vercel

---

## 📚 Documentation

- **[🔐 Security & Access Control](docs/SECURITY_ACCESS_CONTROL.md)** - Enterprise-grade security architecture and RBAC implementation
- **[🔑 Authentication System](docs/app-next-directory/AUTHENTICATION.md)** - NextAuth.js v5 setup with comprehensive role management
- **[📖 Documentation Index](docs/INDEX.md)** - Complete table of contents and quick navigation
- **[🔌 API Documentation](docs/API_DOCUMENTATION.md)** - Comprehensive API reference with security details
- **[🗂️ Reference Library](docs/reference/)** - Changelog, contribution guide, workspace setup notes, troubleshooting playbooks, and consolidation reports
- All documentation now lives in [`docs/`](docs/), with workspace-specific guides in [`docs/sanity/`](docs/sanity/) and [`docs/app-next-directory/`](docs/app-next-directory/).
- Context files remain in [`memory-bank/`](memory-bank/) for knowledge continuity.
- See [`docs/README.md`](docs/README.md) for navigation and structure.

### 🔧 Troubleshooting

- **[WSL Disconnection Fix Guide](docs/reference/WSL_DISCONNECTION_FIX_GUIDE.md)** - Comprehensive guide for resolving Next.js worker module errors and WSL disconnection issues
- **WSL Turborepo helper**: `scripts/turbo-wsl-safe-run.sh` keeps Turborepo tasks lightweight to avoid Remote-WSL disconnects when running multiple commands.
- **[Scripts Documentation](scripts/README.md)** - Utility scripts for maintenance and troubleshooting

---

## 🚦 Project Status (January 2026)
- **Next.js 16 migration in progress**: The monorepo is running on the feature branch that enables cache components, async route data, and the simplified Turbopack-friendly `next.config` as documented in `app-next-directory/docs/Upgrade Nextjs v.16/`. The new middleware/runtime helpers and migration guides keep production workloads aligned with the latest Next.js platform.
- **Documentation consolidated**: The root documentation hub (`docs/`, `docs/REFERENCE/`, and workspace-specific guides) is fully merged, last refreshed in January 2026, and continues to drive onboarding, testing, and deployment knowledge.
- **Testing automation adapting**: Jest, Playwright, and auxiliary tooling are being updated for the asynchronous params/searchParams requirements introduced in Next.js 16; existing suites cover auth, analytics, and search flows while new helper docs outline the updated mocking strategies.
- **Content workflows live**: Sanity schemas, migration scripts, and preview integrations remain validated, with content authors able to stage eco-friendly listings and traveler stories through the documented CMS workflow.
- **Deployment readiness**: Vercel builds, GitHub Actions, and monitoring hooks remain active while the team validates Next.js 16 production builds and prepares the pilot environment for the refreshed frontend.

---

## 🔜 Next Steps

- Prepare the curated pilot content release by syncing Sanity drafts, verifying preview links, and publishing the refreshed marketing page once the Next.js 16 build is green.

---

## 🤝 Contributing

See [`docs/README.md`](docs/README.md) and [`docs/reference/CONTRIBUTING.md`](docs/reference/CONTRIBUTING.md) for guidelines on documentation, coding standards, and review process.

---

## 📬 Contact

For access requests or questions, contact the project administrator.
