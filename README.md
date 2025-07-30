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

- All documentation is in [`docs/`](docs/), with subfolders for [`sanity/`](docs/sanity/), [`app-next-directory/`](docs/app-next-directory/), and [`shared/`](docs/shared/).
- Six key context files are retained in [`memory-bank/`](memory-bank/).
- See [`docs/README.md`](docs/README.md) for navigation and structure.

---

## 🚦 Project Status (July 2025)

- Monorepo and documentation reorganization complete
- Next.js app, Sanity Studio, and admin dashboard fully integrated
- Sanity schemas updated and aligned with frontend requirements
- Sanity codegen integrated for TypeScript type generation
- DTOs adopted for consistent data handling in the Next.js app
- Playwright test automation and reporting configured
- Workstreams A–F and pre-integration testing completed
- Integration/testing phase ready

---

## 🔜 Next Steps

- Finalize workspace README and context file updates
- Complete reference updates to new doc locations
- Begin next roadmap phase: user onboarding, analytics, and performance optimization

---

## 🤝 Contributing

See [`docs/README.md`](docs/README.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on documentation, coding standards, and review process.

---

## 📬 Contact

For access requests or questions, contact the project administrator.