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
<!-- TASKMASTER_EXPORT_START -->
> 🎯 **Taskmaster Export** - 2025-08-22 08:55:58 UTC
> 📋 Export: with subtasks • Status filter: none
> 🔗 Powered by [Task Master](https://task-master.dev?utm_source=github-readme&utm_medium=readme-export&utm_campaign=sustainable-eco-friendly-digital-nomads-directory&utm_content=task-export-link)

| Project Dashboard |  |
| :-                |:-|
| Task Progress     | ████░░░░░░░░░░░░░░░░ 20% |
| Done | 2 |
| In Progress | 1 |
| Pending | 7 |
| Deferred | 0 |
| Cancelled | 0 |
|-|-|
| Subtask Progress | ████░░░░░░░░░░░░░░░░ 19% |
| Completed | 5 |
| In Progress | 1 |
| Pending | 21 |


| ID | Title | Status | Priority | Dependencies | Complexity |
| :- | :-    | :-     | :-       | :-           | :-         |
| 1 | Set up Tailwind v4 Global Styles | ✓&nbsp;done | high | None | ● 4 |
| 1.1 | Install Tailwind and Configure Basic Setup | ✓&nbsp;done | -            | None | N/A |
| 1.2 | Define and Verify Container Class and Font Styles | ✓&nbsp;done | -            | None | N/A |
| 2 | Create Root Layout with Header and Footer | ✓&nbsp;done | high | 1 | ● 5 |
| 2.1 | Create Basic Layout Structure | ✓&nbsp;done | -            | None | N/A |
| 2.2 | Implement Header Component | ✓&nbsp;done | -            | None | N/A |
| 2.3 | Implement Footer Component | ✓&nbsp;done | -            | None | N/A |
| 3 | Implement Home Page | ►&nbsp;in-progress | high | 2 | ● 6 |
| 3.1 | Create app/page.tsx and Basic Structure | ►&nbsp;in-progress | -            | None | N/A |
| 3.2 | Implement Featured Listings Section | ○&nbsp;pending | -            | 3.1 | N/A |
| 3.3 | Implement City Carousel Section | ○&nbsp;pending | -            | 3.1 | N/A |
| 4 | Implement Listing Detail Page Shell | ○&nbsp;pending | high | 2 | ● 5 |
| 4.1 | Create `app/listings/[slug]/page.tsx` file | ○&nbsp;pending | -            | None | N/A |
| 4.2 | Implement `generateMetadata` function | ○&nbsp;pending | -            | None | N/A |
| 4.3 | Render `ListingDetailView` component with placeholder content | ○&nbsp;pending | -            | None | N/A |
| 5 | Implement City Detail Page Shell | ○&nbsp;pending | high | 2 | ● 5 |
| 5.1 | Create `app/city/[slug]/page.tsx` file | ○&nbsp;pending | -            | None | N/A |
| 5.2 | Implement page structure | ○&nbsp;pending | -            | 5.1 | N/A |
| 5.3 | Pass mock data to components | ○&nbsp;pending | -            | 5.2 | N/A |
| 6 | Implement Advanced Search Page with Auto-Redirect | ○&nbsp;pending | high | 2 | ● 8 |
| 6.1 | Create `app/search/page.tsx` and basic structure | ○&nbsp;pending | -            | None | N/A |
| 6.2 | Implement the search bar and filter sidebar | ○&nbsp;pending | -            | 6.1 | N/A |
| 6.3 | Implement the listing grid | ○&nbsp;pending | -            | 6.2 | N/A |
| 6.4 | Implement the auto-redirect functionality | ○&nbsp;pending | -            | 6.3 | N/A |
| 7 | Implement Featured Listings Section | ○&nbsp;pending | medium | 3 | ● 4 |
| 7.1 | Create FeaturedListingsSection.tsx and basic structure | ○&nbsp;pending | -            | None | N/A |
| 7.2 | Integrate ListingGrid and pass listings prop | ○&nbsp;pending | -            | 7.1 | N/A |
| 8 | Implement City Carousel Section | ○&nbsp;pending | medium | 3 | ● 4 |
| 8.1 | Create CityCarouselSection.tsx and Basic Structure | ○&nbsp;pending | -            | None | N/A |
| 8.2 | Integrate CityCarousel and Link to City Detail Pages | ○&nbsp;pending | -            | 8.1 | N/A |
| 9 | Update ListingCard to use Slug for Navigation | ○&nbsp;pending | medium | 4 | ● 5 |
| 9.1 | Modify ListingCard to use slug for the link | ○&nbsp;pending | -            | None | N/A |
| 9.2 | Verify navigation across different sections | ○&nbsp;pending | -            | 9.1 | N/A |
| 10 | Create Search Wrapper Components | ○&nbsp;pending | medium | 6 | ● 6 |
| 10.1 | Create SearchBox.tsx Wrapper | ○&nbsp;pending | -            | None | N/A |
| 10.2 | Create FiltersSidebar.tsx Wrapper | ○&nbsp;pending | -            | None | N/A |
| 10.3 | Verify Prop Handling and Rendering | ○&nbsp;pending | -            | 10.1, 10.2 | N/A |

> 📋 **End of Taskmaster Export** - Tasks are synced from your project using the `sync-readme` command.
<!-- TASKMASTER_EXPORT_END -->

