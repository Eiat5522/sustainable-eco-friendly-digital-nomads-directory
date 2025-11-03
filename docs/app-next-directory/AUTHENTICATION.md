# 🔐 Authentication & Account Management – `app-next-directory`

The authentication stack is built on **NextAuth.js v5** with a credentials provider, MongoDB persistence, and Upstash Redis rate limiting. This document reflects the consolidated implementation after the final testing cycle.

## Architecture Overview
- **Central config**: `src/lib/auth.ts` exports the NextAuth options consumed by `/api/auth/[...nextauth]`, wiring credentials-based sign-in, session callbacks, and rate limiting guards. 【F:app-next-directory/src/lib/auth.ts†L1-L80】【F:app-next-directory/app/api/auth/[...nextauth]/route.ts†L1-L18】
- **Database adapter**: MongoDB is accessed through the workspace adapter, persisting users, sessions, verification tokens, and login attempts. Models live under `src/models/` (`User`, `LoginAttempt`, `PasswordResetToken`, `EmailVerificationToken`). 【F:app-next-directory/src/models/User.ts†L1-L43】【F:app-next-directory/src/models/LoginAttempt.ts†L1-L40】
- **Rate limiting**: `src/lib/auth/rateLimit.ts` integrates Upstash Redis (5 attempts per minute) with MongoDB-backed audit logging, protecting the credentials flow from brute-force attacks. 【F:app-next-directory/src/lib/auth/rateLimit.ts†L1-L40】
- **Role-based access control**: Role metadata (`UserRole`) accompanies JWT sessions; protected routes (e.g., `/api/admin/**`, dashboard pages) validate `admin`/`superAdmin` roles before allowing access. 【F:app-next-directory/app/api/admin/analytics/route.ts†L1-L20】【F:app-next-directory/app/dashboard/page.tsx†L1-L34】

## API Surface
| Endpoint | Method(s) | Purpose | Source |
|----------|-----------|---------|--------|
| `/api/auth/[...nextauth]` | GET, POST | Handles NextAuth callbacks for sign-in/out and session retrieval | [`app/api/auth/[...nextauth]/route.ts`](../../app-next-directory/app/api/auth/[...nextauth]/route.ts) |
| `/api/auth/register` | POST | Creates new users, hashes passwords, and guards against duplicate emails | [`app/api/auth/register/route.ts`](../../app-next-directory/app/api/auth/register/route.ts) |
| `/api/auth/request-password-reset` | POST | Issues reset tokens and dispatches email notifications | [`app/api/auth/request-password-reset/route.ts`](../../app-next-directory/app/api/auth/request-password-reset/route.ts) |
| `/api/auth/reset-password` | POST | Validates tokens, updates hashed passwords, and invalidates reuse | [`app/api/auth/reset-password/route.ts`](../../app-next-directory/app/api/auth/reset-password/route.ts) |
| `/api/auth/verify` | POST | Confirms email verification tokens and activates users | [`app/api/auth/verify/route.ts`](../../app-next-directory/app/api/auth/verify/route.ts) |
| `/api/user/profile` | GET, PUT | Retrieves and updates the signed-in user profile (name, avatar) | [`app/api/user/profile/route.ts`](../../app-next-directory/app/api/user/profile/route.ts) |

All endpoints share helpers from `src/lib/auth/serverAuth.ts` and `src/lib/auth/userService.ts` to keep token enrichment and user lookups consistent across pages, server components, and route handlers. 【F:app-next-directory/src/lib/auth/serverAuth.ts†L1-L44】【F:app-next-directory/src/lib/auth/userService.ts†L1-L56】

## Security Controls
- **Credential hashing**: `bcryptjs` is applied during registration and resets before data is persisted. 【F:app-next-directory/app/api/auth/register/route.ts†L34-L63】
- **Redis-backed throttling**: Each login attempt is keyed by email/IP and enforced via `enforceLoginRateLimit` helpers; failures record entries in `LoginAttempt`. 【F:app-next-directory/src/lib/auth/rateLimit.ts†L18-L67】【F:app-next-directory/src/models/LoginAttempt.ts†L1-L40】
- **Session callbacks**: JWT and session callbacks enrich tokens with the user role, ensuring client-side guards can read role data. 【F:app-next-directory/src/lib/auth.ts†L20-L74】
- **Email verification**: Verification tokens are generated with expiry safeguards (`src/models/EmailVerificationToken.ts`) and consumed in `/api/auth/verify`. 【F:app-next-directory/src/models/EmailVerificationToken.ts†L1-L36】【F:app-next-directory/app/api/auth/verify/route.ts†L20-L70】

## Testing Status (✅ Completed)
- **Library tests**: `src/lib/auth/*.test.ts` cover adapter behavior, JWT callbacks, rate limiter flows, and server auth helpers. 【F:app-next-directory/src/lib/auth/rateLimit.test.ts†L1-L38】【F:app-next-directory/src/lib/auth/serverAuth.test.ts†L1-L32】
- **Route suites**: Each API route ships with targeted Jest coverage validating success and error responses, including rate-limit messaging. 【F:app-next-directory/app/api/auth/register/route.test.ts†L1-L52】【F:app-next-directory/app/api/auth/request-password-reset/__tests__/route.test.ts†L1-L34】【F:app-next-directory/app/api/auth/verify/__tests__/route.test.ts†L1-L34】
- **Integration surfaces**: Dashboard/profile pages assert that protected routes redirect or render appropriately once authenticated. 【F:app-next-directory/app/dashboard/page.tsx†L1-L34】【F:app-next-directory/app/profile/page.tsx†L1-L20】

Run `pnpm test:unit` to execute the full authentication suite; `pnpm test:e2e` includes Playwright flows for sign-in, profile updates, and newsletter opt-ins, providing end-to-end confidence after the final testing phase. 【F:app-next-directory/package.json†L19-L42】
