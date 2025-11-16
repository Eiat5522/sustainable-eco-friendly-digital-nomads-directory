Summary

Health score: 5/10. Critical flows (auth/session reads) depend on Redis credentials being present; without them, cache lookups throw and break user fetching, so the app cannot run in environments where Upstash is optional.

The listing detail page calls its own API over HTTP with a localhost fallback, which will fail once deployed behind a production domain and incurs redundant serialization work.

ISR revalidation endpoints look for a lowercase process.env.revalidationToken, leaving route invalidation unusable unless the environment variable is defined with the exact casing the code expects.

Multiple test-harness routes and unused Sanity helpers ship in the production bundle, increasing surface area without serving the live product.

Technical Debt

High – Redis cache hard dependency. getRedisCredentials throws when either Upstash variable is missing, but getUserById always passes through withMongooseCache, so authentication requests crash instead of degrading to an uncached query. Fix: wrap the credential lookup in a guard that returns undefined when Redis is optional, and have withMongooseCache bail out before touching Redis in that case.

High – Listing reviews fetched via internal HTTP. The listing page builds an absolute URL using NEXT_PUBLIC_BASE_URL with a localhost default, meaning reviews disappear outside dev and the server double-handles the same request. Fix: invoke the reviews data layer directly (or a server action) so the page can share database access and Next.js caching without brittle environment assumptions.

Medium – Revalidation token casing mismatch. Both /api/revalidate and /api/revalidate-all check process.env.revalidationToken; any uppercase REVALIDATION_TOKEN (the common convention) is ignored, silently disabling ISR purges. Fix: centralize the token in a helper that normalizes casing and fail fast if the expected variable is absent.

Medium – Pre-release auth stack & duplicated Tailwind dependency. The app relies on next-auth@5.0.0-beta.30, and tailwindcss is listed in both dependencies and devDependencies, inflating install time and making lockfiles noisy. Fix: plan an upgrade path to the stable NextAuth 5 release (or stick to 4.x until 5 GA) and keep Tailwind in a single dependency block.

Low – Test harness pages bundled for production. Routes such as /test-gallery and /test-reviews load placeholder images from picsum.photos, adding unnecessary bandwidth and external calls in prod. Fix: move these fixtures behind feature flags or delete them before release.

Dead Code

File Path Line(s) Snippet Removal Impact
app-next-directory/src/lib/auth/userService.ts 1-200 export async function findSanityUserByEmail… plus companion CRUD helpers are never imported outside their own test file. Safe to delete (or move into the real auth flow) to reduce unused Sanity client code; keeps secrets off the client bundle.
app-next-directory/app/test-gallery/page.tsx 1-58 Dev-only gallery showcase route rendering Picsum images. Remove or gate with an env flag; otherwise the production build includes an unlinked test page hitting external services.
app-next-directory/app/test-reviews/page.tsx 1-45 Async “Test Reviews Section” wrapper using hard-coded reviews. Delete or relocate to Storybook; keeping it live adds routes that don’t map to the public product.
Coding Improvements

app/listings/[slug]/page.tsx

Replace the ad-hoc Promise wrapper in Params with the standard App Router signature so the component can be a pure async server component.
Before:

type Props = { params: Promise<{ slug: string }> };
const { slug } = await params;

````​:codex-file-citation[codex-file-citation]{line_range_start=17 line_range_end=320 path=app-next-directory/app/listings/[slug]/page.tsx git_url="https://github.com/Eiat5522/sustainable-eco-friendly-digital-nomads-directory/blob/revert-2/detail-pages/app-next-directory/app/listings/[slug]/page.tsx#L17-L320"}​
**After:**
```ts
type Props = { params: { slug: string } };
const { slug } = params;
Move fetchReviews onto the server data layer (e.g., reuse the Mongo aggregation in app/api/reviews) instead of calling fetch(new URL('/api/reviews', …)). This keeps everything within one request lifecycle, lets you apply cache()/revalidateTag, and removes the brittle base URL logic.

app/api/revalidate*/ utilities

Introduce a shared getRevalidationToken() helper that reads process.env.REVALIDATION_TOKEN once, normalizes casing, and throws during boot when the token is missing. Both routes can then reference the same guard and share audit logging for denied attempts.

Consider adding basic rate limiting or headers().get('Authorization') support, since these routes are publicly reachable and should fail closed.

package.json & dependency hygiene

Remove the duplicate tailwindcss entry from devDependencies and pin it in dependencies to avoid dual installations.

Schedule an upgrade from next-auth@5.0.0-beta.30 to the eventual stable 5.x (or fall back to 4.x) once the adapter and JWT callbacks are verified. The beta currently changes callback shapes between releases, increasing maintenance risk.

Repository tooling

Add a Husky + lint-staged (or Biome) workflow so pnpm lint, pnpm check-types, and formatting run pre-commit and in CI, keeping the large monorepo consistent without relying on manual commands. The existing scripts already expose lint/type commands, so wiring them into a hook is straightforward.

Test fixtures exposure

Either relocate /test-gallery and /test-reviews into Storybook or guard them with if (process.env.NODE_ENV !== 'production') to prevent accidental inclusion in the production sitemap and to eliminate unsolicited outbound HTTP requests to Picsum
````
