# 🧩 Component System – `app-next-directory`

The component library balances reusable UI primitives with domain-specific modules for listings, search, and account management. Everything ships with strict TypeScript typings and co-located tests, giving the team confidence after the latest testing phase.

## Directory Structure
| Folder | Purpose | Example |
|--------|---------|---------|
| `layout/` | Application chrome: navigation, footer, page wrappers, and session-aware layouts | [`src/components/layout/Header.tsx`](../../app-next-directory/src/components/layout/Header.tsx) |
| `sections/` | Home page and marketing sections powered by API data | [`src/components/sections/FeaturedListings.tsx`](../../app-next-directory/src/components/sections/FeaturedListings.tsx) |
| `listings/` | Listing detail views, hero sections, reviews, and related venue blocks | [`src/components/listings/ListingDetailView.tsx`](../../app-next-directory/src/components/listings/ListingDetailView.tsx) |
| `search/` | Filters, multi-select inputs, and search orchestration logic | [`src/components/search/SearchFiltersForm.tsx`](../../app-next-directory/src/components/search/SearchFiltersForm.tsx) |
| `profile/` | Authenticated profile management and edit forms | [`src/components/profile/ProfileEditForm.tsx`](../../app-next-directory/src/components/profile/ProfileEditForm.tsx) |
| `ui/` | Design system primitives (Neo buttons, inputs, cards, carousel helpers) | [`src/components/ui/neo-button.tsx`](../../app-next-directory/src/components/ui/neo-button.tsx) |
| root files | Cross-cutting utilities (providers, MSW bootstrapping) | [`src/components/Providers.tsx`](../../app-next-directory/src/components/Providers.tsx) |

Each folder groups React components, hooks, styles, and tests to mirror business domains. Shared utilities (like `cn`, DTO types, and Sanity helpers) are imported via the `@/` alias for consistency across the codebase. 【F:app-next-directory/tsconfig.json†L1-L20】

## Design System Highlights
- **Neo UI**: Buttons, badges, inputs, and cards share consistent variants, focus states, and accessible defaults via the Neo naming convention. 【F:app-next-directory/src/components/ui/neo-button.tsx†L1-L22】【F:app-next-directory/src/components/ui/neo-card.tsx†L1-L32】
- **Composable sections**: Marketing blocks like `FeaturedListings` and `CityCarousel` rely on UI primitives plus Embla carousel utilities for smooth, keyboard-friendly interactions. 【F:app-next-directory/src/components/sections/FeaturedListings.tsx†L1-L18】【F:app-next-directory/src/components/ui/ImageCarousel.tsx†L1-L24】
- **Responsive navigation**: The header dynamically adapts to session state, exposing admin links and auth controls only when permitted. 【F:app-next-directory/src/components/layout/Header.tsx†L1-L34】

## Domain Components
- **Listings**: `ListingDetailView` orchestrates hero, gallery, reviews, and related venues; it consumes DTOs shared with the App Router pages. 【F:app-next-directory/src/components/listings/ListingDetailView.tsx†L1-L36】
- **Search**: `SearchFiltersForm` maps API payloads into filter inputs, normalizing query params before routing. 【F:app-next-directory/src/components/search/SearchFiltersForm.tsx†L1-L22】
- **Profile**: `ProfileEditForm` handles optimistic updates and integrates with user-profile APIs. 【F:app-next-directory/src/components/profile/ProfileEditForm.tsx†L1-L20】

## Testing Coverage (✅ Completed)
Component suites live under `src/components/__tests__/` and run with `pnpm test:unit`. Snapshot-free assertions exercise interactive logic without relying on the DOM outside of Jest + Testing Library. 【F:app-next-directory/src/components/__tests__/Providers.test.tsx†L1-L26】【F:app-next-directory/src/components/__tests__/CommentForm.test.tsx†L1-L30】

Playwright smoke tests render key pages (home, city, listing detail) to ensure component composition holds up in full-browser environments. Combined with unit suites, this satisfied the component testing exit criteria for the latest release.
