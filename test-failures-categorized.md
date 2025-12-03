# Test Failures Categorization

**Test Run Summary:**
- Total Test Suites: 332 (34 failed, 298 passed)
- Total Tests: 4,128 (72 failed, 4,056 passed)
- Duration: 207.856s

---

## Category 1: Console Logging/Spy Issues (Majority ~60 failures)

These tests expect console.log/warn/error to be called but the mocks aren't being triggered properly.

### Console.log/warn/error Spy Failures:

#### Auth & Authentication (13 tests)
- `app/api/auth/[...nextauth]/__tests__/route.test.ts`
  - GET handler: forwards GET requests to NextAuth (consoleLogSpy not called)
  - GET handler: logs the pathname for GET requests
  - GET handler: handles errors during URL parsing gracefully (consoleErrorSpy not called)
  - POST handler: logs the pathname for POST requests
  - POST handler: handles various NextAuth callback endpoints
  - Logging behavior: logs module load on import
  - Logging behavior: logs incoming requests

- `src/lib/auth/rateLimit.test.ts` (10 tests)
  - Allows login attempts when no limiter is available or when errors occur
  - Warns when redis client cannot be obtained during initialization
  - Warns when redis change handler encounters normalization errors
  - Clears stored config when limiter construction fails
  - Logs initialization rejections while allowing login attempts
  - recordLoginAttempt: skips invalid email addresses
  - recordLoginAttempt: skips records when email parameter is not a string
  - recordLoginAttempt: logs attempts using collection insert and falls back to model create on failure
  - recordLoginAttempt: warns when both collection insert and model fallback fail
  - recordLoginAttempt: handles database connection failures gracefully
  - recordLoginAttempt: logs collection errors when the model rejection lacks details

- `src/lib/auth/withAuthMatrix.test.ts`
  - withAuth (legacy): logs deprecation warning

- `src/lib/__tests__/auth.test.ts`
  - callbacks.signIn: never blocks sign-in when verification syncing fails
  - callbacks.jwt: enriches token metadata and reports allowlist failures

- `app/api/auth/update-profile/route.test.ts`
  - Logs and reports server errors

- `app/api/auth/register/route.test.ts`
  - Should return 400 if the body cannot be parsed

#### Sanity/CMS (8 tests)
- `src/lib/__tests__/sanity-http-client.test.ts`
  - Warns about missing optional environment variables
  - create: returns created document and logs in debug mode
  - create: logs an alternate message when a document is created without an id
  - update: logs debug information when SANITY_HTTP_DEBUG is enabled
  - delete: logs debug information when deleting documents

- `src/lib/sanity/cached-client.test.ts`
  - Logs and continues when redis read fails
  - Ignores redis write errors after fetching fresh data

- `src/lib/sanity/data.test.ts`
  - getListingData: should handle fetch errors gracefully

#### Performance & Analytics (15 tests)
- `src/lib/performance/__tests__/performance-budgets.test.ts`
  - evaluatePerformanceMetric: logs a warning and returns unknown for missing categories or metrics
  - getMetricThresholds: returns null and logs when the metric is missing

- `src/lib/performance/__tests__/budgets.test.ts`
  - sendAlert: should log to console when console channel is enabled
  - sendAlert: should log with correct severity format
  - sendAlert: should handle slack webhook failure gracefully
  - sendAlert: should handle multiple alerts sequentially

- `src/lib/performance/__tests__/web-vitals-reporter.test.ts`
  - Logs metrics in development mode before sending them
  - measureFunctionTime: measures execution time using the performance API when available
  - measureFunctionTime: uses raw execution time when toFixed is unavailable
  - recordMetric: posts metrics using fetch when sampling passes in development
  - recordMetric: ignores failures when JSON serialization throws

- `app/api/performance/web-vitals/__tests__/route.test.ts`
  - Error Handling: should log errors to console

- `src/lib/performance/__tests__/collector.test.ts`
  - Wires reporters, logs metrics in development, and forwards data to Plausible

- `src/lib/performance/__tests__/withPerformanceTracking.test.tsx`
  - Logs debug output in development mode

- `src/lib/performance/__tests__/plausible.test.ts`
  - reportPerformanceEvent: should warn if plausible is not initialized
  - usePerformanceTracking: should work when plausible is not initialized

- `src/lib/analytics/plausible/__tests__/hooks.test.tsx`
  - usePlausibleAnalytics: logs events in development mode

- `src/lib/analytics/__tests__/config.test.ts`
  - Logs failures from analytics helpers

- `src/lib/analytics/__tests__/useExperiment.test.tsx`
  - handles activation failures gracefully

#### Database & Caching (7 tests)
- `src/lib/mongodb/__tests__/init.test.ts`
  - initializeDatabase: creates the sessions collection, indexes, and other index definitions
  - initializeDatabase: continues when the sessions collection already exists
  - initializeDatabase: logs and rethrows unexpected errors

- `src/lib/__tests__/mongoose-cache.test.ts`
  - withMongooseCache: logs a warning and falls back to executing the query when cache read fails
  - withMongooseCache: logs a warning when cache write fails but still returns the query result

- `src/lib/__tests__/redis.test.ts`
  - Allows manually setting and subscribing to redis client updates
  - Logs a warning when a listener throws during notification

#### Components (9 tests)
- `src/components/favorites/__tests__/FavoriteButton.test.tsx`
  - Error Handling: logs error to console on favorite check failure

- `src/components/auth/__tests__/SocialAuthRow.test.tsx`
  - Provider Loading: handles fetch error gracefully

- `src/components/layout/__tests__/Header.test.tsx`
  - useSafeSession hook: warns in development when rendered without SessionProvider
  - useSafeSession hook: only warns once even when re-rendered without SessionProvider

- `src/components/listings/__tests__/ReviewsSection.test.tsx`
  - Shows a fallback error when the request throws

- `src/components/listings/__tests__/ListingDetailView.test.tsx`
  - Logs an error when the API responds with a non-success status
  - Logs an error when the favorites request rejects

- `src/components/ui/__tests__/InteractiveMap.test.tsx`
  - Shows an error if map initialization fails

- `app/profile/__tests__/error.test.tsx`
  - Should cleanup effect on unmount

- `app/admin/__tests__/error.test.tsx`
  - Should cleanup effect on unmount

#### API Routes (2 tests)
- `app/api/contact/route.test.ts`
  - Successful Submissions: warns when admin contact email is not configured

- `app/test/search/__tests__/page.test.tsx`
  - Should handle fetch error gracefully

---

## Category 2: Navigation/Redirect Issues (2 failures)

These involve Next.js redirect or navigation mocking issues.

### Files:
- `app/city/[slug]/__tests__/page.test.tsx`
  - LegacyCityAlias page: permanently redirects to the updated city route (permanentRedirectMock not called)
  - LegacyCityAlias page: encodes complex slugs before redirecting

---

## Category 3: JSDOM Navigation Errors (1 failure)

Window.location.href assignment not implemented in JSDOM.

### Files:
- `app/auth/login/__tests__/LoginForm.test.tsx`
  - handles signIn rejections gracefully
  - Error: "Not implemented: navigation (except hash changes)"

---

## Root Cause Analysis

### Primary Issue: Console Spy Mocking
The vast majority of failures (~60/72) are related to console spy expectations. This suggests:
1. **Jest configuration changes** - Console mocking may have been disabled or changed
2. **Test setup issues** - `beforeEach`/`afterEach` hooks may not be running properly
3. **Timing issues** - Console calls happening before spies are attached
4. **Mock restoration** - Previous tests not cleaning up properly

### Secondary Issue: Next.js Mocking
- `permanentRedirect` from `next/navigation` not being properly mocked
- JSDOM navigation limitations with `window.location.href`

---

## Recommended Fix Priorities

### Priority 1: Fix Console Spy Infrastructure (60+ tests)
**Target files to investigate:**
1. `jest.config.js` or `jest.setup.js` - Check console mock setup
2. Test setup files - Verify spy attachment timing
3. Common test utilities - Ensure consistent spy setup/teardown

**Potential solutions:**
- Add global console spy setup in jest.setup.js
- Use `jest.spyOn(console, 'log')` consistently
- Ensure spies are created before imports/renders
- Check if `console.log` is being suppressed by test environment

### Priority 2: Fix Navigation Mocks (3 tests)
**Target files:**
1. Add proper mock for `next/navigation` `permanentRedirect`
2. Mock `window.location.href` setter in JSDOM environment

### Priority 3: Verify Test Environment
- Check recent changes to Jest configuration
- Verify test setup files are being loaded
- Ensure mock cleanup is happening between tests

---

## Next Steps

1. **Investigate jest configuration** for console handling
2. **Check test setup files** for spy initialization
3. **Review recent commits** that may have changed test infrastructure
4. **Run a single failing test** in isolation to debug spy behavior
5. **Fix console spy setup** globally to resolve bulk of failures
6. **Add navigation mocks** for Next.js routing
