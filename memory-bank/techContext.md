# Technologies Used
- Next.js 15.3.2 (App Router, TypeScript)
- Tailwind CSS 4.1.6
- Leaflet.js (interactive maps, client-only)
- StaticMapImage (SSR/SEO fallback)

Development Setup:
- Node.js 20+
- pnpm or npm
- Windows (pwsh.exe shell)

Technical Constraints:
- Leaflet.js must not be imported at the top level in SSR context.
- All map components must be dynamically imported with SSR disabled.
- Map logic must be isolated in client-only components.

Dependencies:
- next, react, react-dom, tailwindcss, leaflet

Tool Usage Patterns:
- Dynamic import for all browser-only libraries.
- Static fallback for SEO.
- Memory bank is updated after every significant change.

## Testing (Added: 2025-05-14)

- **Framework:** Playwright for end-to-end testing.
- **Configuration:**
    - ES Module syntax adopted for `playwright.config.ts` and all test files.
    - Test utilities created for common operations:
        - `map-test-utils.ts`: For Leaflet map interactions (pan, zoom, marker checks).
        - `filter-test-utils.ts`: For managing listing filters.
        - `test-assertions.ts`: For common assertions (loading states, empty states).
        - `test-fixtures.ts`: For custom test fixtures (e.g., `mockListings`).
        - `test-setup.ts`: For global test setup (API mocking, viewport setup).
- **Key Decisions & Rationale:**
    - **API Mocking:** Implemented using Playwright's request interception (`setupMockApi`) to ensure test reliability, speed, and independence from external services.
    - **Utility Functions:** Abstracted common test logic into reusable utilities to improve maintainability and readability of test specs.
    - **ES Modules:** Standardized on ES Modules for consistency with the Next.js application codebase and modern JavaScript practices.
- **Integration Specifics:**
    - Tests cover map component functionality (clustering, filtering), mobile responsiveness, and various UI states.
    - Comprehensive documentation created for the testing setup, utilities, and writing guidelines within the `/app-scaffold/tests/` directory.
