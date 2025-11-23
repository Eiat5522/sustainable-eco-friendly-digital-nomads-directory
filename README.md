# Sustainable Eco-Friendly Digital Nomads Directory

A curated monorepo providing a global platform for sustainable, eco-friendly venues and services for digital nomads, built with Next.js 15+, Sanity CMS, and modern authentication.

## ⚡ 2-Minute Quick Start

Get the project running in 2 minutes:

```bash
# 1. Clone and install dependencies
git clone https://github.com/Eiat5522/sustainable-eco-friendly-digital-nomads-directory.git
cd sustainable-eco-friendly-digital-nomads-directory
npm install

# 2. Setup environment
cp .env.example app-next-directory/.env.local
# Edit app-next-directory/.env.local with your MongoDB and Sanity credentials

# 3. Start development server
npm run dev
# → Open http://localhost:3000
```

**Need help with setup?** See the [Complete Onboarding Guide](./docs/ONBOARDING.md)

### Windows PowerShell
```powershell
# Alternative: Use clean install script
.\clean-install.ps1
```

### Environment Setup
- **MongoDB**: Free tier at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Sanity CMS**: Free account at [sanity.io](https://sanity.io)
- **Configuration**: See [Environment Guide](./docs/ENVIRONMENT.md)

## 🏗️ Project Architecture

This is a **monorepo** containing multiple interconnected applications and a unified documentation structure:

```
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/          # Main Next.js application
├── sanity/                      # Sanity CMS configuration
├── listings/                    # Data processing & migration scripts
├── docs/                        # Project documentation (see below)
├── memory-bank/                 # Context, logs, and session files (six key context files retained)
└── tasks/                       # Task management files
```

- **Curated Eco-Friendly Listings**
  - Verified sustainability practices with community-reviewed scores
  - Comprehensive venue data with eco-certifications
- **Advanced Search & Filtering**
  - Full-text and multi-category filtering
  - Geographic and eco-tag filtering
  - Digital nomad features (WiFi, workspace, community)
- **Authentication & User Management**
  - NextAuth.js with role-based access
  - Multi-tier user roles (user, editor, venueOwner, admin, superAdmin)
- **Interactive Features**
  - Leaflet.js maps with OpenStreetMap
  - User reviews, favorites, and event calendar
- **Modern UI/UX**
  - Responsive design (Tailwind CSS)
  - Dark mode, Framer Motion animations, accessible components

## 🛠️ Tech Stack

### Frontend

- **Next.js 15+** (App Router, TypeScript)

- **Tailwind CSS**
- **Framer Motion**, **Radix UI**, **React Hook Form**, **Zod**

### Backend & CMS

- **Sanity.io** (Headless CMS)
- **MongoDB Atlas** (user/auth data)

### DevOps & Testing

- **GitHub Actions** (CI/CD)
- **Vercel** (deployment)
- **Playwright** (E2E testing, reports in `app-next-directory/playwright-report/`)

## 📚 Documentation Structure

All documentation is now under the `docs/` directory, with subfolders for `sanity/`, `app-next-directory/`, and `shared/`. Six key context files are retained in `memory-bank/`.

## 🚦 Current Status (May 2025)

- Monorepo structure and documentation reorganization complete
- Next.js app and Sanity Studio fully integrated
- All legacy docs migrated to new structure
- Playwright test automation and reporting configured
- Parallel workstreams A–F and pre-integration testing strategy completed

## 🔜 Next Steps

- Finalize README and context file updates
- Complete reference updates to new doc locations
- Begin next roadmap phase: user onboarding and analytics
