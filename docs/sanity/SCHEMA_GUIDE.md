# 📜 Schema Guide – Sanity Workspace

This guide summarizes the core document and object schemas that power the directory experience. Use it alongside [`ARCHITECTURE.md`](ARCHITECTURE.md) for environment setup details.

## Core Document Types
| Schema | Description | File |
|--------|-------------|------|
| `listing` | Venue listings with names, slugs, geo data, amenities, sustainability tags, and Sanity references to cities. | [`sanity/schemas/listing.js`](../../sanity/schemas/listing.js) |
| `city` | City landing pages with hero content, featured listings, and location metadata. | [`sanity/schemas/city.js`](../../sanity/schemas/city.js) |
| `blogPost` | Editorial content with hero images, SEO fields, and portable text body blocks. | [`sanity/schemas/blogPost.js`](../../sanity/schemas/blogPost.js) |
| `review` | Moderated reviews with rating, status, and references to listings and users. | [`sanity/schemas/review.js`](../../sanity/schemas/review.js) |
| `event` | Events and community gatherings with schedule, venue, and organizer metadata. | [`sanity/schemas/event.js`](../../sanity/schemas/event.js) |
| `user` / `userFavorite` | Represents app users and their saved listings for personalization flows. | [`sanity/schemas/user.js`](../../sanity/schemas/user.js), [`sanity/schemas/userFavorite.js`](../../sanity/schemas/userFavorite.js) |

## Supporting Objects & Fields
- **Amenities & eco initiatives**: Enumerations for eco features, amenities, and sustainability tags reused across listings. 【F:sanity/schemas/amenity.js†L1-L28】【F:sanity/schemas/ecoInitiatives.js†L1-L30】
- **Location detail blocks**: Nested objects for address, opening hours, and pricing plans tailored to coworking spaces and accommodations. 【F:sanity/schemas/address.js†L1-L32】【F:sanity/schemas/objects/coworkingPricingPlan.js†L1-L32】
- **Search & analytics metadata**: Custom fields for search boosting and listing analytics that fuel the Next.js dashboards. 【F:sanity/schemas/searchBoost.js†L1-L20】【F:sanity/schemas/listingAnalytics.js†L1-L34】

## Validation & Editorial Workflow
- Required fields (`Rule.required()`) guard critical listing attributes such as `name`, `slug`, and `type`. 【F:sanity/schemas/listing.js†L1-L40】
- Moderation statuses and workflow enums (`moderationStatus.js`) help editors move submissions through review queues. 【F:sanity/schemas/moderationStatus.js†L1-L28】
- Rich text blocks (`richText.js`) centralize allowed marks, portable text components, and callouts for consistent editing. 【F:sanity/schemas/richText.js†L1-L36】

## Synchronization with Next.js
After schema updates:
1. Run `pnpm update-types` in the `sanity` workspace to regenerate type definitions.
2. Commit the generated `sanity.types.ts` file in the Next.js workspace if shapes change. 【F:sanity/package.json†L15-L18】【F:app-next-directory/sanity.types.ts†L1-L20】
3. Re-run `pnpm test:unit` in `app-next-directory` to ensure DTO transformers and GROQ queries still match the schema. 【F:app-next-directory/package.json†L19-L34】

These steps were executed during the final testing pass to keep the studio and frontend in sync.
