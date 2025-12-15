# Codebase Summary

This summary provides an up-to-date overview of the architecture, major modules, and technical decisions for the **Sustainable Eco-Friendly Digital Nomads Directory**.

---

## 🏗️ Architecture Overview

- **Monorepo**: Next.js frontend, Sanity CMS backend, shared utilities, and testing.
- **Frontend**: Next.js 15.3.2 (App Router), TypeScript, Tailwind CSS 4.1.6.
- **Backend**: Sanity CMS (content), MongoDB Atlas (user/session data), NextAuth.js (authentication).
- **Testing**: Playwright (120+ E2E tests), Jest for unit tests.
- **Deployment**: Vercel (frontend), Sanity Cloud (CMS), GitHub Actions (CI/CD).

---

## 📦 Major Modules

- **app-next-directory/**: Main Next.js app, API routes, authentication, user dashboard, admin dashboard, analytics, geo-search, and advanced filtering.
- **sanity/**: CMS schemas, editorial workflow, migration scripts, image pipeline.
- **shared/**: Coding standards, troubleshooting, and cross-domain docs.
- **Testing/**: Playwright, E2E, and unit test documentation.
- **memory-bank/**: Context, logs, and session files for project continuity.

---

## 🚀 Recent Technical Decisions

- **Admin Dashboard**: Comprehensive analytics, moderation, and bulk operations endpoints.
- **Geocoding Utility**: Refined for accuracy, robust error handling, and full test coverage ([`src/lib/geocode.ts`](../app-next-directory/src/lib/geocode.ts)).
- **Sanity Data Fetching**: Dedicated module for optimized queries ([`src/lib/sanity/data.ts`](../app-next-directory/src/lib/sanity/data.ts)).
- **Role-Based Access**: 5-tier RBAC system, enforced in API and UI.
- **Testing**: Expanded Playwright and Jest coverage for all new features.
- **Performance**: CDN image optimization, caching, and efficient data projections.

---

## 🧩 Completed Features

- Admin dashboard and analytics endpoints
- Bulk operations and moderation tools
- User dashboard, favorites, and analytics
- Advanced search with geo/eco filtering
- City carousel and detail pages
- Secure authentication and session management
- Full Playwright/Jest test coverage for all critical paths

---

## 📚 References

- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Development Guide](DEVELOPMENT_GUIDE.md)
- [Testing Guide](Testing/README.md)
- [Troubleshooting](shared/TROUBLESHOOTING.md)
- [Active Context](../memory-bank/activeContext.md)
- [Progress Log](../memory-bank/progress.md)

---

_Last updated: July 2025_
