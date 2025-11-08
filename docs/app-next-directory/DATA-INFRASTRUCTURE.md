# 🗄️ Data Infrastructure – `app-next-directory`

The frontend workspace relies on MongoDB for persistent data and Upstash Redis for rate limiting and transient caching. This guide replaces the older setup notes and consolidates the final production configuration now that integration testing has passed.

## MongoDB Connection Strategy
- **Single cached connection**: `src/lib/dbConnect.ts` throws if `MONGODB_URI` is missing, then caches the resolved `mongoose` connection to reuse across requests. 【F:app-next-directory/src/lib/dbConnect.ts†L1-L34】
- **Global cache**: Connections are stored on `globalThis.mongoose` to avoid re-connecting during serverless cold starts or test suites. 【F:app-next-directory/src/lib/dbConnect.ts†L12-L28】
- **Retry safety**: Failed attempts reset the cached promise so future requests can retry cleanly. 【F:app-next-directory/src/lib/dbConnect.ts†L29-L34】

### Environment Requirements
Add `MONGODB_URI` to the workspace environment (`.env.local`, `.env.development`, or platform secrets). The connection helper refuses to run without it, which prevents silent fallbacks in production. 【F:app-next-directory/src/lib/dbConnect.ts†L3-L8】

### Models & Schema Coverage
All collections live in `src/models/` and ship with Jest suites (`src/models/__tests__`) to lock down schema contracts and indexes. Highlights include:
- **Users & auth tokens**: `User`, `LoginAttempt`, `PasswordResetToken`, `EmailVerificationToken`. 【F:app-next-directory/src/models/User.ts†L1-L43】【F:app-next-directory/src/models/LoginAttempt.ts†L1-L40】
- **Engagement data**: `NewsletterSubscriber`, `ContactSubmission`, `UserFavorite`, `AnalyticsEvent`. `NewsletterSubscriber` now centralises email normalisation in schema utilities and pre-save/update hooks so every persistence path stores lowercase, trimmed addresses even when mocks bypass native setters. 【F:app-next-directory/src/models/NewsletterSubscriber.ts†L1-L118】【F:app-next-directory/src/models/ContactSubmission.ts†L1-L36】
- **Testing coverage**: `ContactSubmission.integration.test.ts` exercises real connection logic, and every model has unit tests verifying schema defaults. 【F:app-next-directory/src/models/__tests__/ContactSubmission.integration.test.ts†L1-L36】【F:app-next-directory/src/models/__tests__/User.test.ts†L1-L38】

### Verification Scripts
Use `node test-mongodb-connection.js` for manual smoke checks; it attempts a connection, runs a CRUD cycle, and cleans up after itself. 【F:app-next-directory/test-mongodb-connection.js†L1-L36】

## Upstash Redis Rate Limiting
- **Client management**: `src/lib/redis.ts` lazily creates a Redis client using `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, caches it globally, and exposes helpers for tests to override the client. 【F:app-next-directory/src/lib/redis.ts†L1-L64】
- **Login protection**: `src/lib/auth/rateLimit.ts` applies a 5-attempt sliding window limiter per identifier, persisting attempts to `LoginAttempt` for short-term auditing. 【F:app-next-directory/src/lib/auth/rateLimit.ts†L1-L40】【F:app-next-directory/src/models/LoginAttempt.ts†L1-L40】
- **Graceful fallbacks**: In test environments the limiter can be overridden or skipped, and production errors fall back to MongoDB-backed attempt tracking without blocking the login flow. 【F:app-next-directory/src/lib/auth/rateLimit.ts†L39-L64】

The `app/api/auth/register` and password-reset routes consume both MongoDB and Redis utilities, and their Jest suites assert that missing credentials surface friendly error messages. 【F:app-next-directory/app/api/auth/register/route.ts†L1-L52】【F:app-next-directory/app/api/auth/request-password-reset/__tests__/route.test.ts†L1-L34】

## Testing Status (✅ Completed)
- **Unit & integration**: `src/lib/__tests__/dbConnect.integration.test.ts` verifies cached connections and error handling, while `src/lib/auth/rateLimit.test.ts` covers Redis fallbacks and limiter behavior. 【F:app-next-directory/src/lib/__tests__/dbConnect.integration.test.ts†L1-L32】【F:app-next-directory/src/lib/auth/rateLimit.test.ts†L1-L38】
- **API contracts**: Newsletter, contact, and auth routes mock `dbConnect`/Redis to guard against regressions. 【F:app-next-directory/app/api/contact/route.test.ts†L1-L34】【F:app-next-directory/app/api/newsletter/subscribe/route.test.ts†L1-L30】

Running `pnpm test:unit` exercises the entire persistence surface, confirming that the data layer is production-ready following the final testing phase. 【F:app-next-directory/package.json†L19-L34】
