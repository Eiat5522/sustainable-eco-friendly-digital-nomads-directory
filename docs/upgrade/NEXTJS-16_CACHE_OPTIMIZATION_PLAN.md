# Next.js 16 Caching Optimization Plan

This strategy details the caching configuration for the `staging-nextjs-16` branch. Routes are categorized into public customer-facing sections and private back-office sections to align with Next.js 16.1 Cache Components.

## 🏠 Customer-Facing Routes (Public)

### Homepage (Landing Page) – `/`

- **Rendering Type:** This page is fully static and cached publicly.

- **Strategy:** Content is prerendered at build time and stored in the Full Route Cache.

- **Directive:** Add `'use cache'` at the top of `page.tsx` to include it in the static HTML shell.

- **Cache Lifetime:** Use a long lifetime, such as `cacheLife('days')`.

- **Revalidation:** Tag the content with `cacheTag('home')` and use `revalidateTag('home')` via CMS webhooks for updates.

- **🚨 Error Prevention:** Ensure the root layout and page do not call dynamic APIs like `cookies()` or `headers()`.

- **🗑️ Cleanup:** Remove legacy `export const dynamic` segment configs.

#### Sanity Webhook Setup (Home + Core Content)

- **Endpoint:** `POST /api/sanity/webhook`
- **Auth:** `x-sanity-webhook-token: <REVALIDATION_TOKEN>`
- **Payload:** Standard Sanity webhook payload with `_type` or `document._type`
- **Tags revalidated:** `home` (always), plus `featured-listings` for `listing`, `cities` for `city`, and `eco-tags` for `ecoTag`

Example curl:

```bash
curl -X POST https://<your-domain>/api/sanity/webhook \
  -H "content-type: application/json" \
  -H "x-sanity-webhook-token: $REVALIDATION_TOKEN" \
  -d '{"_type":"listing"}'
```

### Listings Directory Page – `/listings`

- **Rendering Type:** Static content with opportunistic partial updates.

- **Strategy:** Use `'use cache'` at the top so data is fetched at build/prerender time.

- **💡 Performance Tip:** If using `searchParams`, wrap data queries in a cached function keyed by filter values to hit the Data Cache even for dynamic requests.

- **PPR (Partial Prerendering):** Wrap interactive elements like maps in `<Suspense>` so the static list renders instantly while the map streams in.

- **⚠️ Warning:** Isolate client-side filtering logic in small `'use client'` components to keep the main list server-rendered.

### Listing Details Page – `/listings/[slug]`

- **Rendering Type:** Statically rendered per listing.

- **Strategy:** Use `generateStaticParams` to pre-build popular pages and `'use cache'` for CMS data.

- **Revalidation:** Use `cacheLife('max')` with `cacheTag(\`listing-${slug}`)` for on-demand CMS updates.

- **🚫 Warning:** Do not make the whole page dynamic for small user-specific elements like a "Save to Favorites" button; handle these via client-side components.

### City & Category Pages – `/city/[slug]` & `/category/[slug]`

- **Rendering Type:** Mostly static landing pages.

- **Strategy:** Use `generateStaticParams` to pre-build all known cities and categories.

- **Revalidation:** Use `cacheLife('hours')` with granular tags like `cacheTag(\`city-${slug}`)`.

- **🚨 Error Prevention:** Avoid reading `searchParams` directly on the city page to maintain static eligibility.

---

## 👤 User Dashboard (Authenticated) – `/dashboard`

- **Rendering Type:** **Dynamic** because it reads the user session and cookies.

- **Optimization:** Perform auth checks at the top of the page, then move heavy data queries into a separate async function marked `'use cache'`.

- **🔐 Privacy & Security:** Pass the `userId` as an argument to the cached function; this keys the cache specifically to that user and prevents data leaking.

- **Cache Lifetime:** Use a short duration, such as `cacheLife({ stale: 300, expire: 900 })`.

### Implementation Pattern

```typescript
// Define this in a server utility file
export async function getUserStats(userId: string) {
    "use cache";
    cacheLife({ stale: 300, expire: 900 });
    cacheTag(`user-stats-${userId}`); // Tag for targeted invalidation

    // Database logic for counts, reviews, and favorites
    return await db.stats.findMany({ where: { userId } });
}
```

- **⚡ Refresh Logic:** After a user adds a listing, call `updateTag(\`user-stats-${userId}`)` in the server action to instantly refresh their stats.

---

## 🛠️ Back-Office (Admin) Routes

### Admin Dashboard (Site Analytics) – `/admin`

- **Rendering Type:** Dynamic (due to auth) but utilizes a **Global Cache** for analytics data shared among all admins.

- **🚀 Optimization:** Convert to an **async server component** to fix the current "double round-trip" caused by client-side API fetches.

- **Cache Lifetime:** `cacheLife({ stale: 300, revalidate: 600 })` to reduce CMS and database stress.

- **💡 Performance Tip:** Partition the analytics into sub-tasks with `<Suspense>` boundaries to stream deeper metrics while displaying summary stats immediately.

### Admin Moderation Queue – `/admin/moderation`

- **Rendering Type:** Dynamic with `'use cache'` for the fetch function.

- **Strategy:** Key the cache by filter parameters (status, type) so different views are stored separately.

- **Revalidation:** Invoke `updateTag('moderation')` inside server actions immediately after an approval or rejection.

- **⚠️ Warning:** Perform role checks **before** invoking the cached function to ensure data isn't cached for unauthorized requests.

---

## 📋 General Implementation Principles

- **Server Component First:** Use Server Components by default; only use `'use client'` for interactivity like buttons or maps.

- **Internal Data Cache:** Rely on Next.js’s internal Data Cache which persists across deployments; no external Redis layer is required.

- **Directive Preference:** Favor `'use cache'` and `cacheLife` over legacy `export const revalidate` or `dynamic` configs for better flexibility.

---

## ✅ Migration Checklist for the Team

### Phase 1: Public Routes

- [ ] Add `'use cache'` and `cacheLife('days')` to the Homepage (`/`).

- [ ] Remove `export const dynamic` from the Homepage and Root Layout.

- [x] Add `/api/sanity/webhook` to revalidate `home` + related tags on CMS updates.

- [ ] Configure Sanity webhooks to call `/api/sanity/webhook` with `x-sanity-webhook-token`.

- [ ] Implement `generateStaticParams` for City and Category pages.

- [ ] Implement `generateStaticParams` for Listing Detail pages.

- [ ] Wrap the Listing Detail data fetch in `'use cache'` with tag-based revalidation.

### Phase 2: Authenticated & Admin Routes

- [ ] Refactor `/dashboard` to use a `userId`-keyed function with `'use cache'`.

- [ ] Convert `/admin` to a Server Component and implement server-side analytics fetching.

- [ ] Apply `cacheLife` to the Admin Analytics function (5-minute stale window).

- [ ] Add `updateTag('moderation')` to moderation server actions.

### Phase 3: Validation & Cleanup

- [ ] Audit all components to ensure interactive widgets are the only `'use client'` files.

- [ ] Verify that no dynamic APIs (`cookies()`, `headers()`) are called inside cached public functions.

- [ ] Test on-demand revalidation for Listings via CMS webhooks.
