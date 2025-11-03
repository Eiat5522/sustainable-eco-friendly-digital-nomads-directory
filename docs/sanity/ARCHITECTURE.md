# 🏛️ Sanity Studio Architecture

The Sanity workspace provides the content backend for the Sustainable Eco-Friendly Digital Nomads Directory. The studio is configured in `sanity.config.js` with the `structure`, `vision`, and `code-input` plugins enabled for editors. 【F:sanity/sanity.config.js†L1-L15】

## Schema Organization
Schemas live under `sanity/schemas/` and are re-exported through `schemaTypes`. 【F:sanity/schemas/index.js†L1-L36】 Key document types include:
- **Listing (`listing.js`)** – Primary venue data with geo-location, sustainability tags, gallery images, and Sanity references to cities. 【F:sanity/schemas/listing.js†L1-L48】
- **City (`city.js`)** – Location metadata, featured venues, and highlight content for the App Router pages. 【F:sanity/schemas/city.js†L1-L40】
- **Blog Post (`blogPost.js`)** – Editorial content with SEO fields and rich-text blocks. 【F:sanity/schemas/blogPost.js†L1-L32】
- **Review (`review.js`)** – Moderated user feedback with rating metadata and workflow status. 【F:sanity/schemas/review.js†L1-L40】
- **User & Favorites (`user.js`, `userFavorite.js`)** – Associates Sanity content with authenticated app users for bookmarking flows. 【F:sanity/schemas/user.js†L1-L38】【F:sanity/schemas/userFavorite.js†L1-L30】

Supporting objects cover amenities, eco initiatives, pricing plans, and opening hours to keep document definitions modular. 【F:sanity/schemas/objects/coworkingPricingPlan.js†L1-L32】【F:sanity/schemas/objects/openingHoursEntry.js†L1-L32】

## Integration with Next.js
- **Typed client**: The Next.js workspace imports generated schema types via `sanity/types` and consumes content with the shared GROQ client (`app-next-directory/src/lib/sanity/client.ts`). 【F:app-next-directory/src/lib/sanity/client.ts†L1-L28】
- **Dashboards & DTOs**: Dashboard services aggregate Sanity analytics (views, favorites) before rendering in the frontend. 【F:app-next-directory/src/lib/dashboard/user-dashboard.ts†L1-L28】
- **Sitemap & SEO**: App Router helpers fetch slugs directly from Sanity to populate `sitemap.ts` and structured metadata. 【F:app-next-directory/app/sitemap.ts†L1-L34】

## Commands & Tooling
Package scripts provide a consistent workflow during development and release:
- `pnpm dev` / `pnpm start` – Run or preview the studio locally. 【F:sanity/package.json†L11-L18】
- `pnpm build` / `pnpm deploy` – Produce production bundles and deploy to Sanity hosting. 【F:sanity/package.json†L11-L18】
- `pnpm update-types` – Extract schemas and regenerate TypeScript definitions for the Next.js workspace. 【F:sanity/package.json†L15-L18】
- `pnpm lint` – Validates schema files against the Sanity ESLint configuration. 【F:sanity/package.json†L18-L21】

## Testing & Verification Status (✅ Completed)
During the consolidation effort we executed the Sanity lint task and regenerated schema types to ensure compatibility with the Next.js workspace. No automated tests ship with the studio (`npm test` intentionally fails), so linting plus manual studio verification remain the validation gates. 【F:sanity/package.json†L11-L22】
