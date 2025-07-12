Technologies Used:
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
