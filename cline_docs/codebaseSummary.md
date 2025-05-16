# Codebase Summary (cline_docs/codebaseSummary.md) - Initial Setup

This document provides a high-level overview of the 'Sustainable Digital Nomads in Thailand' project structure and key architectural aspects. It will be updated as the codebase evolves.

## Overall Project Structure (Implemented)
```text
/app-scaffold            # Main Next.js application directory
  /src
    /app                 # Next.js App Router (pages, layouts)
      /layout.tsx        # Root layout with metadata and common structure
      /page.tsx          # Homepage component
      /globals.css       # Global styles including Tailwind imports
      /listings          # Listings directory route
        /page.tsx        # Main listings page with filtering/sorting
        /[id]            # Dynamic route for individual listing details
          /page.tsx      # Individual listing detail page
    /components         # Reusable React components
      /layout           # Layout-specific components
        /Header.tsx     # Site header component
        /Footer.tsx     # Site footer component
      /listings         # Listing-specific components
        /ListingCard.tsx # Displays a single listing item in a card format
        /ListingGrid.tsx # Displays a grid of ListingCard components
        /ImageGallery.tsx # Component for displaying listing images
    /lib                # Utility functions
      /listings.ts      # Functions for fetching and processing listing data
    /styles             # Additional styles (placeholder)
    /hooks              # Custom React hooks (placeholder)
    /types              # TypeScript type definitions
      /listings.ts      # TypeScript interfaces and enums for listing data
  /public              # Static assets
  /next.config.ts      # Next.js TypeScript configuration
  /postcss.config.mjs  # PostCSS configuration for Tailwind
  /package.json        # Project dependencies and scripts
  /tsconfig.json       # TypeScript configuration
/src
  /data                # Data directory
    /listings.json     # Structured listing data
/memory-bank           # Cline's Memory Bank - Core project context
/.clinerules           # Cline configuration files
/brand-guidelines-logos # Brand assets and guidelines
/cline_docs            # Project documentation
/tests                # Playwright end-to-end tests
  /utils              # Test utilities and helpers
    /map-test-utils.ts    # Map interaction helpers
    /filter-test-utils.ts # Filter management utilities
    /test-assertions.ts   # Common test assertions
    /test-fixtures.ts     # Test fixtures
    /test-setup.ts       # Global test setup
  /setup              # Test setup and configuration
  /map-integration.spec.ts # Map component tests
  /TESTING.md         # Testing overview and setup
  /WRITING_GUIDE.md   # Test writing guidelines
  /API-MOCKING.md     # API mocking documentation
```

## Key Components and Their Interactions (Current Implementation)
- **Root Layout (`/src/app/layout.tsx`):**
  - Defines site-wide structure and metadata
  - Integrates Header and Footer components
  - Sets up fonts (Geist Sans and Geist Mono)
  - Configures SEO metadata
- **Homepage (`/src/app/page.tsx`):**
  - Simple welcome page with project description.
- **Layout Components:**
  - `Header.tsx`: Navigation and branding.
  - `Footer.tsx`: Site information, links, and copyright.
- **Listing Components (`/src/components/listings/`):**
  - `ListingCard.tsx`: Renders an individual listing summary. Used in `ListingGrid.tsx`.
  - `ListingGrid.tsx`: Arranges multiple `ListingCard` components in a responsive grid. Used on the main listings page.
  - `ImageGallery.tsx`: Displays images for a listing. Used on the individual listing detail page.
- **Listing Pages (`/src/app/listings/`):**
  - `page.tsx` (Main Listings Page): Displays listings with client-side filtering, sorting, pagination, loading states, and context-specific "no listings" messages. Uses `ListingGrid.tsx`.
  - `[id]/page.tsx` (Individual Listing Page): Displays detailed information for a single listing. Uses `ImageGallery.tsx`.
- **Listing Components (`/src/components/listings/`):**
  - `ListingCard.tsx`: Renders an individual listing summary. Image optimization with Next.js `Image` and `sizes` prop confirmed.
  - `ListingGrid.tsx`: Arranges `ListingCard` components. Internal "no listings" check removed as parent (`ListingsPage.tsx`) now handles this.
  - `ImageGallery.tsx`: Displays images for a listing.

## Data Flow (Current Implementation)
1. **Listing Data:**
   - Sourced from `src/data/listings.json` (currently sample data).
   - Accessed via utility functions in `src/lib/listings.ts`.
   - Typed using interfaces in `src/types/listings.ts`.
2. **Client-Side Interaction (`/app/listings/page.tsx`):**
   - Manages state for filters (category, city), sorting preferences, and current page for pagination.
   - `useEffect` hooks process `allListings` based on these states.
   - `filteredListings` holds the complete list after filtering/sorting.
   - `paginatedListings` holds the subset of `filteredListings` for the current page.
   - `isLoading` state provides feedback during data processing.
   - `ListingGrid` receives `paginatedListings`.
3. **Static Content & SSR/SSG:** Next.js App Router handles page rendering. Individual listing pages (`/[id]/page.tsx`) use `generateMetadata` for dynamic SEO.
4. **Styling:** Using Tailwind CSS v4.1.6 with `@tailwindcss/postcss` integration. Brand guidelines are applied for visual consistency.
5. **Component Structure:**
   - Root layout provides the base structure.
   - Header and Footer components frame the content.
   - Listing-specific components handle the display of directory data.

## External Dependencies (Current Implementation, Post-MVP)
- **Core Frameworks:**
  - Next.js 15.3.2 (with TypeScript and App Router)
  - React 19.0.0
  - Tailwind CSS 4.1.6
- **Development Dependencies:**
  - TypeScript
  - ESLint
  - PostCSS integration via `@tailwindcss/postcss`

## Data Management
- **Listing Data:**
  - Raw research notes stored in `cline_docs/potential_listings_research.md`.
  - Structured listing data stored in `src/data/listings.json`.
  - Schema documented in `cline_docs/data_schema.md`.
  - TypeScript interfaces for listings defined in `src/types/listings.ts`.
- **User Data:** (Planned) To be implemented in future phases.
- **CMS Data:** (Planned) To be implemented in future phases.

## Recent Significant Changes
1. **Testing Implementation (Completed - 2025-05-14):**
   - Implemented Playwright end-to-end testing framework with ES Module support
   - Created comprehensive test utilities:
     - Map interaction helpers (pan, zoom, marker checks)
     - Filter management utilities
     - Common assertions for loading and empty states
     - Custom test fixtures
   - Established API mocking strategy using Playwright's request interception
   - Added thorough documentation:
     - Testing overview and setup guide
     - Test writing guidelines with examples
     - API mocking documentation
     - Utility function reference
   - Set up CI integration for automated test runs
   - Documentation available in `/app-scaffold/tests/` directory

2. **Listing Data Population (In Progress):**
   - Created image subfolders in `app-scaffold/public/images/listings/` for all listings.
   - Sourced and placed images for "Shinei Office Space", "JustCo One City Centre", and "Pier Lab".
   - `firecrawl_scrape` failed for "Plantiful" (Facebook URL); manual download pending.
3. **Listing Display UI Refinements (Completed):**
   - Implemented pagination on the main listings page (`app/listings/page.tsx`).
   - Added loading state indicators (initial load and during filter/sort changes) to `app/listings/page.tsx`.
   - Enhanced error/empty state handling with context-specific messages on `app/listings/page.tsx`.
   - Simplified `ListingGrid.tsx` by removing its internal "no listings" check.
   - Confirmed image optimization in `ListingCard.tsx`.
4. **Listing Display Implementation (Initial - Completed):**
   - Created TypeScript interfaces for listing data (`src/types/listings.ts`).
   - Developed core listing components: `ListingCard.tsx`, `ListingGrid.tsx`.
   - Implemented listing routes: `/listings` and `/listings/[id]`.
   - Styled components according to brand guidelines.
   - Added client-side filtering and sorting to the main listings page.
5. **Styling Updates (Completed):**
    - Updated global styles in `app/globals.css` to use the correct color palette.
    - Updated header and listings page styling.
    - Updated hero section styling.
    - Added a subtle border and adjusted the hover effect for the listing cards.
6. **Project Scaffolding (Completed - Previous Phase):**
   - Next.js 15.3.2 project initialized with TypeScript and App Router.
   - Tailwind CSS 4.1.6 integrated with PostCSS.
   - Basic components structure created (Header, Footer).
   - Initial layout and homepage implemented.
7. **Sanity CMS Integration (Completed):**
   - Implemented Sanity Content Schema.
   - Configured content previews.
   - Implemented custom input components.
8. **Authentication & Testing Suite (Completed):**
   - Added comprehensive authentication flow tests.
   - Tested role-based access.
   - Validated API route protection.
   - Tested session management.
   - Added integration tests.
9. **Documentation Updates (Ongoing):**
   - Updated `techStack.md` with specific versions.
   - Updated `memory-bank` files (`productContext.md`, `activeContext.md`, `progress.md`).
   - Updated `cline_docs/currentTask.md`.
   - Updated this document (`codebaseSummary.md`) to reflect current implementation.
10. **Directory Structure (Established):**
   - Established `/src` directory structure following best practices.
   - Added `/listings` subdirectories in `/app` and `/components`.
   - Added `listings.ts` in `/lib` and `/types`.

## User Feedback Integration and Its Impact on Development (Planned)
- As per `projectbrief.md`, regular user testing and feedback loops will be established.
- Feedback will be logged, analyzed, and used to inform the `projectRoadmap.md` and prioritize feature development or adjustments.
- Specific mechanisms for collecting feedback will be defined during the MVP development phase.

## Branding and Visual Assets
- **Logo and Brand Guidelines:** Located in the `brand-guidelines-logos/` directory.
  - `sustainable_nomads.png`: Main project logo
  - `colour_pallet.jpg`: Defines the project's color scheme
  - `design_inspiration.jpg`: Provides visual inspiration for the UI/UX
- These assets should be consulted for all UI design and branding efforts to ensure consistency.
