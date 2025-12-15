# 🔌 API Surface – `app-next-directory`

The Next.js workspace exposes a rich set of REST endpoints under `app/api/**`. This guide summarizes the current contract after consolidating legacy notes and confirms the test coverage achieved during the final verification phase.

## Authentication & User Account APIs
| Endpoint | Method(s) | Description | Tests |
|----------|-----------|-------------|-------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth entry point for credentials sign-in, callbacks, and session retrieval | Covered through `src/lib/auth/*.test.ts` and route smoke tests |
| `/api/auth/register` | POST | Validates input, checks duplicates, hashes passwords, and returns a safe user payload | [`app/api/auth/register/route.test.ts`](../../app-next-directory/app/api/auth/register/route.test.ts) |
| `/api/auth/request-password-reset` | POST | Issues password reset tokens and triggers transactional email delivery | [`app/api/auth/request-password-reset/__tests__/route.test.ts`](../../app-next-directory/app/api/auth/request-password-reset/__tests__/route.test.ts) |
| `/api/auth/reset-password` | POST | Confirms tokens, re-hashes passwords, and cleans up reset records | [`app/api/auth/reset-password/__tests__/route.test.ts`](../../app-next-directory/app/api/auth/reset-password/__tests__/route.test.ts) |
| `/api/auth/verify` | POST | Confirms email verification codes and activates pending users | [`app/api/auth/verify/__tests__/route.test.ts`](../../app-next-directory/app/api/auth/verify/__tests__/route.test.ts) |
| `/api/user/profile` | GET, PUT | Retrieves and updates the signed-in user profile (name, avatar, role) | [`app/api/user/profile/route.test.ts`](../../app-next-directory/app/api/user/profile/route.test.ts) |

These endpoints share helpers from `src/lib/auth` to enforce role-based access, Redis rate limiting, and MongoDB-backed persistence. 【F:app-next-directory/src/lib/auth.ts†L1-L80】【F:app-next-directory/src/lib/auth/serverAuth.ts†L1-L44】

## Listings, Cities, and Discovery
| Endpoint | Method(s) | Description | Source |
|----------|-----------|-------------|--------|
| `/api/listings` | GET, POST | Paginates listings, validates payloads, and delegates database operations to shared helpers | [`app/api/listings/route.ts`](../../app-next-directory/app/api/listings/route.ts) |
| `/api/featured-listings` | GET | Fetches highlighted venues from Sanity and transforms them into DTOs | [`app/api/featured-listings/route.ts`](../../app-next-directory/app/api/featured-listings/route.ts) |
| `/api/cities` | GET | Returns city metadata for search filters and sitemap generation | [`app/api/cities/route.ts`](../../app-next-directory/app/api/cities/route.ts) |
| `/api/categories`, `/api/digital-nomad-features`, `/api/eco-tags` | GET | Supplies taxonomy datasets consumed by the search UI | [`app/api/categories/route.ts`](../../app-next-directory/app/api/categories/route.ts) |
| `/api/events`, `/api/amenities`, `/api/legacy-listings` | GET | Backfills marketing data or legacy content for transitional features | [`app/api/events/route.ts`](../../app-next-directory/app/api/events/route.ts) |

Listings endpoints rely on GROQ queries, DTO transformers, and Sanity clients under `src/lib/` to keep the data model consistent between the API and App Router pages. 【F:app-next-directory/src/lib/dto-transformer.ts†L1-L36】【F:app-next-directory/src/lib/sanity/client.ts†L1-L28】

## Engagement & Communications
| Endpoint | Method(s) | Description | Tests |
|----------|-----------|-------------|-------|
| `/api/contact` | POST | Persists contact submissions, sends acknowledgement emails, and rate-limits abusive traffic | [`app/api/contact/route.test.ts`](../../app-next-directory/app/api/contact/route.test.ts) |
| `/api/newsletter/subscribe` | POST | Stores opt-ins, throttles duplicate submissions via Redis, and emails confirmation links | [`app/api/newsletter/subscribe/route.test.ts`](../../app-next-directory/app/api/newsletter/subscribe/route.test.ts) |
| `/api/newsletter/confirm` | GET | Validates confirmation tokens and finalizes the subscription | [`app/api/newsletter/confirm/__tests__/route.test.ts`](../../app-next-directory/app/api/newsletter/confirm/__tests__/route.test.ts) |
| `/api/reviews` | GET, POST | Manages reviews with role-aware moderation and structured logging | [`app/api/reviews/route.test.ts`](../../app-next-directory/app/api/reviews/route.test.ts) |
| `/api/comments` | GET, POST | Handles blog comments, spam filtering, and moderation states | [`app/api/comments/route.ts`](../../app-next-directory/app/api/comments/route.ts) |

All engagement flows reuse the shared `structuredLogger`, `sendMail`, and DTO helpers to ensure consistent messaging and auditing. 【F:app-next-directory/src/lib/logger.ts†L143-L213】【F:app-next-directory/src/lib/email.ts†L1-L32】

## Admin & Analytics Endpoints
| Endpoint | Method(s) | Description | Source |
|----------|-----------|-------------|--------|
| `/api/admin/analytics` | GET | Requires admin privileges and aggregates dashboard metrics from Sanity and MongoDB | [`app/api/admin/analytics/route.ts`](../../app-next-directory/app/api/admin/analytics/route.ts) |
| `/api/admin/moderation`, `/api/admin/users`, `/api/admin/bulk-operations` | GET, POST | Provide admin tooling for approving listings, managing users, and running maintenance tasks | [`app/api/admin/moderation/route.ts`](../../app-next-directory/app/api/admin/moderation/route.ts) |
| `/api/performance/web-vitals` | POST | Collects core web vitals and forwards alerts to performance services | [`app/api/performance/web-vitals/route.ts`](../../app-next-directory/app/api/performance/web-vitals/route.ts) |

Admin routes use `auth()` helpers to confirm roles and log security events when unauthorized access is attempted. 【F:app-next-directory/app/api/admin/analytics/route.ts†L1-L36】【F:app-next-directory/src/lib/logger.ts†L167-L213】

## Testing Status (✅ Completed)
- **Unit tests**: Every critical handler is backed by Jest suites under `app/api/**/__tests__` or `app/api/**/route.test.ts`, executed via `pnpm test:unit`. 【F:app-next-directory/package.json†L19-L34】
- **Integration tests**: Playwright E2E specs in `tests/e2e/api` cover sign-in, profile updates, newsletter subscriptions, and content browsing. 【F:app-next-directory/tests/e2e/api/core-endpoints.spec.ts†L1-L40】
- **Logging & rate limiting**: Dedicated suites (`src/lib/auth/rateLimit.test.ts`, `app/api/user/dashboard/route.test.ts`) assert that security controls remain active. 【F:app-next-directory/src/lib/auth/rateLimit.test.ts†L1-L38】【F:app-next-directory/app/api/user/dashboard/route.test.ts†L127-L146】

Run `pnpm test:unit` for rapid API validation and `pnpm test:e2e` for full-stack verification—both concluded successfully during the final testing phase.
