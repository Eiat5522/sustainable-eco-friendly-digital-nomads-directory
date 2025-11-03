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

## 🚦 Project Status (Q1 2025)

- **Core platform stable**: The Next.js frontend, Sanity Studio, and shared DTO layer are fully integrated and operating against the latest schema set.
- **Documentation unified**: All root-level guides now live under [`docs/`](docs/), including the changelog, contribution workflow, and troubleshooting playbooks.
- **Testing automation active**: Linting, type-checking, Jest unit coverage, and Playwright regression suites execute cleanly across workspaces.
- **Content workflows ready**: Sanity content types, data migrations, and preview integrations are validated and prepared for production content seeding.
- **Deployment pipeline verified**: Vercel deployment scripts, environment promotion steps, and monitoring hooks are documented and in use.

---

## 🔜 Next Steps

- Launch curated pilot content set and publish beta marketing page.
- Implement analytics dashboards for sustainability metrics and traveler engagement.
- Continue performance profiling and accessibility audits ahead of public launch.

---

## 🤝 Contributing

See [`docs/README.md`](docs/README.md) and [`docs/reference/CONTRIBUTING.md`](docs/reference/CONTRIBUTING.md) for guidelines on documentation, coding standards, and review process.

---

## 📬 Contact

For access requests or questions, contact the project administrator.
<!-- TASKMASTER_EXPORT_START -->
> 🎯 **Taskmaster Export** - 2025-09-11 10:21:08 UTC
> 📋 Export: without subtasks • Status filter: none
> 🔗 Powered by [Task Master](https://task-master.dev?utm_source=github-readme&utm_medium=readme-export&utm_campaign=sustainable-eco-friendly-digital-nomads-directory&utm_content=task-export-link)

| Project Dashboard |  |
| :-                |:-|
| Task Progress     | ██████████████░░░░░░ 70% |
| Done | 7 |
| In Progress | 1 |
| Pending | 2 |
| Deferred | 0 |
| Cancelled | 0 |
|-|-|
| Subtask Progress | ███████████████░░░░░ 73% |
| Completed | 22 |
| In Progress | 0 |
| Pending | 6 |


| ID | Title | Status | Priority | Dependencies | Complexity |
| :- | :-    | :-     | :-       | :-           | :-         |
| 1 | Set up Tailwind v4 Global Styles | ✓&nbsp;done | high | None | ● 3 |
| 2 | Create Root Layout with Header and Footer | ✓&nbsp;done | high | 1 | ● 4 |
| 3 | Implement Home Page | ✓&nbsp;done | high | 2 | ● 5 |
| 4 | Enhanced Listing Detail Page Shell with Data Fetching Simulation | ✓&nbsp;done | medium | 2 | ● 6 |
| 5 | Implement City Detail Page Shell | ✓&nbsp;done | high | 2 | ● 6 |
| 6 | Implement Advanced Search Page with Auto-Redirect | ►&nbsp;in-progress | high | 2 | ● 8 |
| 7 | Implement Featured Listings Section | ✓&nbsp;done | medium | 3 | ● 6 |
| 8 | Implement City Carousel Section | ✓&nbsp;done | medium | 3 | ● 7 |
| 9 | Update ListingCard to use Slug for Navigation | ○&nbsp;pending | medium | 4 | ● 5 |
| 10 | Create Search Wrapper Components | ○&nbsp;pending | medium | 6 | ● 6 |

> 📋 **End of Taskmaster Export** - Tasks are synced from your project using the `sync-readme` command.
<!-- TASKMASTER_EXPORT_END -->
