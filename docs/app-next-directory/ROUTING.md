# 🗺️ Routing & Endpoint Guide – `app-next-directory`

The Next.js workspace organizes navigation through the App Router with a consistent slug strategy and co-located tests. Dynamic data is fetched from Sanity and MongoDB-backed services, while API routes expose reusable endpoints for the frontend and external consumers.

## Page Routes
| Route | Purpose | Source |
|-------|---------|--------|
| `/` | Home experience with hero, featured listings, and city carousel sections | [`app/page.tsx`](../../app-next-directory/app/page.tsx) |
| `/city/[slug]` | City landing pages with ISR, Sanity-backed content, and localized highlights | [`app/city/[slug]/page.tsx`](../../app-next-directory/app/city/[slug]/page.tsx) |
| `/listings/[slug]` | Venue detail view with DTO transformations and related content | [`app/listings/[slug]/page.tsx`](../../app-next-directory/app/listings/[slug]/page.tsx) |
| `/search` | Faceted search UI driven by shared search utilities | [`app/search/page.tsx`](../../app-next-directory/app/search/page.tsx) |
| `/dashboard` | Authenticated dashboard showing analytics summaries | [`app/dashboard/page.tsx`](../../app-next-directory/app/dashboard/page.tsx) |
| `/profile` | Client-rendered profile management with NextAuth session hooks | [`app/profile/page.tsx`](../../app-next-directory/app/profile/page.tsx) |
| `/blog` & `/blog/[slug]` | Static blog index with Sanity-backed article detail pages | [`app/blog/page.tsx`](../../app-next-directory/app/blog/page.tsx) |
| `/contact` | Alias to `/contact-us` form with Zod validation | [`app/contact/page.tsx`](../../app-next-directory/app/contact/page.tsx) |
| `/contact-us` | Full contact form workflow, feedback states, and marketing copy | [`app/contact-us/page.tsx`](../../app-next-directory/app/contact-us/page.tsx) |

Key SEO helpers—`layout.metadata.ts`, `sitemap.ts`, and `robots.ts`—live alongside the App Router to centralize metadata and crawler configuration. The sitemap pulls fresh slugs directly from Sanity to keep discovery in sync. 【F:app-next-directory/app/layout.metadata.ts†L1-L40】【F:app-next-directory/app/sitemap.ts†L1-L34】【F:app-next-directory/app/robots.ts†L1-L34】

## Dynamic Segments & Slug Strategy
All dynamic routes standardize on the `slug` parameter to avoid conflicting segment names. Page components and their tests rely on this convention when constructing Sanity queries and linking between resources. 【F:app-next-directory/app/city/[slug]/page.tsx†L1-L32】【F:app-next-directory/app/listings/[slug]/page.tsx†L1-L34】【F:app-next-directory/app/listings/[slug]/__tests__/page.test.tsx†L1-L46】

## API Route Families
| Group | Path(s) | Description | Source |
|-------|---------|-------------|--------|
| Authentication | `/api/auth/[...nextauth]`, `/api/auth/register`, `/api/auth/request-password-reset`, `/api/auth/reset-password`, `/api/auth/verify` | Credential sign-in, registration, password recovery, and verification flows | [`app/api/auth/[...nextauth]/route.ts`](../../app-next-directory/app/api/auth/[...nextauth]/route.ts), [`app/api/auth/register/route.ts`](../../app-next-directory/app/api/auth/register/route.ts) |
| User profile | `/api/user/profile` | Retrieves and updates the signed-in user profile | [`app/api/user/profile/route.ts`](../../app-next-directory/app/api/user/profile/route.ts) |
| Listings & discovery | `/api/listings`, `/api/featured-listings`, `/api/cities`, `/api/categories`, `/api/digital-nomad-features`, `/api/eco-tags` | Aggregates listing catalog data with filtering and DTO transformation | [`app/api/listings/route.ts`](../../app-next-directory/app/api/listings/route.ts), [`app/api/featured-listings/route.ts`](../../app-next-directory/app/api/featured-listings/route.ts) |
| Engagement | `/api/contact`, `/api/newsletter/subscribe`, `/api/newsletter/confirm`, `/api/reviews`, `/api/comments` | Captures contact submissions, newsletter opt-ins, and user-generated content | [`app/api/contact/route.ts`](../../app-next-directory/app/api/contact/route.ts), [`app/api/newsletter/subscribe/route.ts`](../../app-next-directory/app/api/newsletter/subscribe/route.ts) |
| Admin & analytics | `/api/admin/**`, `/api/performance`, `/api/analytics` | Admin dashboards, moderation tools, and performance probes | [`app/api/admin/analytics/route.ts`](../../app-next-directory/app/api/admin/analytics/route.ts) |

Each handler composes shared services from `src/lib` and sanitizes responses through reusable helpers, ensuring identical error shapes for the frontend and API clients. 【F:app-next-directory/app/api/contact/route.ts†L1-L65】【F:app-next-directory/app/api/featured-listings/route.ts†L1-L37】

## Routing Tests & Verification
- **Page coverage**: Component-level tests assert that city and listing detail pages render slug-driven data correctly. 【F:app-next-directory/app/city/[slug]/__tests__/page.test.tsx†L1-L38】【F:app-next-directory/app/listings/[slug]/__tests__/page.test.tsx†L1-L46】
- **Layout & metadata**: `app/layout.test.tsx` and `app/sitemap.test.ts` confirm shell behavior and sitemap generation. 【F:app-next-directory/app/layout.test.tsx†L1-L40】【F:app-next-directory/app/sitemap.test.ts†L1-L34】
- **API regression**: Auth, contact, newsletter, and featured listing routes all ship with Jest suites to protect contract changes. 【F:app-next-directory/app/api/auth/register/route.test.ts†L1-L52】【F:app-next-directory/app/api/featured-listings/route.test.ts†L1-L18】【F:app-next-directory/app/api/newsletter/subscribe/route.test.ts†L1-L30】

The finished testing phase executed the full set of routing and API suites (`pnpm test:unit`, `pnpm test:e2e`), giving confidence that navigation, SEO helpers, and REST endpoints deliver consistent results.
