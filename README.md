# Sustainable Eco-Friendly Digital Nomads Directory

A curated monorepo platform for sustainable, eco-friendly venues and services for digital nomads. Built with Next.js 15+, Sanity CMS, and modern authentication.

---

## 🏗️ Monorepo Architecture

```
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/   # Next.js frontend application
├── sanity/               # Sanity CMS configuration
├── listings/             # Data migration scripts
├── docs/                 # Project documentation
├── memory-bank/          # Context, logs, and session files
└── tasks/                # Task management files
```

---

## 🌱 Key Features

- **Curated Eco-Friendly Listings**: Verified venues, sustainability scores, certifications
- **Advanced Search & Filtering**: Full-text, geo, eco-tag, and digital nomad features
- **Authentication & User Management**: NextAuth.js, 5-tier RBAC, secure sessions
- **Admin Dashboard**: Analytics, moderation, bulk operations, user management
- **Interactive Maps**: Leaflet.js, OpenStreetMap, city carousel
- **Modern UI/UX**: Tailwind CSS, Framer Motion, accessible components
- **Testing & CI/CD**: Playwright, GitHub Actions, Vercel deployment

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+, TypeScript, Tailwind CSS, Framer Motion, Radix UI
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

## 🚦 Project Status (December 9, 2025)

- **Next.js 16 migration in progress**: The monorepo is running on the feature branch that enables cache components, async route data, and the simplified Turbopack-friendly `next.config` as documented in `app-next-directory/docs/Upgrade Nextjs v.16/`. The new middleware/runtime helpers and migration guides keep production workloads aligned with the latest Next.js platform.
- **Documentation consolidated**: The root documentation hub (`docs/`, `docs/REFERENCE/`, and workspace-specific guides) is fully merged, last refreshed in December 2024, and continues to drive onboarding, testing, and deployment knowledge.
- **Testing automation adapting**: Jest, Playwright, and auxiliary tooling are being updated for the asynchronous params/searchParams requirements introduced in Next.js 16; existing suites cover auth, analytics, and search flows while new helper docs outline the updated mocking strategies.
- **Content workflows live**: Sanity schemas, migration scripts, and preview integrations remain validated, with content authors able to stage eco-friendly listings and traveler stories through the documented CMS workflow.
- **Deployment readiness**: Vercel builds, GitHub Actions, and monitoring hooks remain active while the team validates Next.js 16 production builds and prepares the pilot environment for the refreshed frontend.

---

## 🔜 Next Steps
- Finish the Next.js 16 upgrade by locking in Cache Component behaviors, finalizing the middleware/runtime helpers, and removing legacy Webpack flags so production builds run without forced FailFast errors.
- Stabilize the Jest + Playwright suites for the new async route data model, refresh snapshots where required, and regenerate any mocks/fixtures that now expose Promise-based params.
- Prepare the curated pilot content release by syncing Sanity drafts, verifying preview links, and publishing the refreshed marketing page once the Next.js 16 build is green.

---

## 🤝 Contributing

See [`docs/README.md`](docs/README.md) and [`docs/reference/CONTRIBUTING.md`](docs/reference/CONTRIBUTING.md) for guidelines on documentation, coding standards, and review process.

---

## 📬 Contact

For access requests or questions, contact the project administrator.
