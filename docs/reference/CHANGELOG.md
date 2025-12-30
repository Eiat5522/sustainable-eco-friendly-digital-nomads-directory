# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation index (INDEX.md) with comprehensive navigation
- Formalized changelog process in CONTRIBUTING.md
- Cross-references between documentation files
- Admin create/edit listing screens in the admin panel

### Changed
- Enhanced documentation structure and discoverability
- Updated contributing guidelines with changelog workflow
- Removed the redundant profile favorites section to prevent the 404 error card from stacking with the working favorites dashboard
- Refined the new listing workflow styling and stabilized numeric form inputs for venue owners
- Centralized revalidation handling for path/tag invalidation and Sanity webhook cache refreshes
- Updated the admin listings edit flow to use the new listing UI inside a modal popup

### Fixed
- Ensured admin route middleware reads session tokens from requests and redirects non-admins to sign-in
- Stacked login/signup panels on smaller screens and limited social sign-in to Google-only setup
- Restored listing editing for venue owners and admins by aligning managed listing APIs with Sanity ownership
- Aligned admin listing stats and table filters with moderation status and featured flags to match published featured counts
- Guarded contact form emails against header injection payloads during client-side validation
- Avoided server-provided featured listings during E2E runs so network retry flows can exercise fetch resilience
- Aligned admin redirects, navigation links, and E2E helpers to use the /admin route

## [0.1.3] - 2025-01-XX

### Added
- Monorepo documentation organization complete
- Next.js app, Sanity Studio, and admin dashboard fully integrated
- Sanity schemas updated and aligned with frontend requirements
- Sanity codegen integrated for TypeScript type generation
- DTOs adopted for consistent data handling in the Next.js app
- Playwright test automation and reporting configured
- Workstreams A–F and pre-integration testing completed

### Changed
- Documentation migrated to new structure under `docs/` directory
- Project references updated to new documentation locations
- Workspace management improved with npm workspaces

### Technical
- Integration/testing phase readiness achieved
- All legacy documentation migrated and updated
- Six key context files retained in `memory-bank/`

## [0.1.0] - 2025-05-13

### Added
- Initial project setup with Next.js 15.3.2
- Image optimization implementation using Next.js Image component
- Interactive map integration with Leaflet.js
- Basic listing components and pages
- Git workflow setup with branching strategy
- Husky pre-commit hooks for code quality
- GitHub Actions for automated PR checks
- Prettier configuration for consistent code formatting
- ESLint configuration
- TypeScript type checking
- Documentation (README, CONTRIBUTING, git setup)
- Project structure and foundation
- Dark mode support
- Responsive design implementation

### Changed
- Updated image components with blur placeholders
- Optimized image loading strategies
- Enhanced map component with SSR handling

### Technical
- Set up development environment and tooling
- Configured Next.js image optimization
- Implemented TypeScript types for listings
- Added proper image sizing and quality settings

---

## Changelog Process

This changelog follows the format established in [CONTRIBUTING.md](CONTRIBUTING.md#changelog-process). 

**For Contributors**: Add entries to the `[Unreleased]` section when making changes. See the [changelog process documentation](CONTRIBUTING.md#changelog-process) for detailed guidelines.

**For Releases**: The release manager will move unreleased changes to the appropriate version section and add release dates.
