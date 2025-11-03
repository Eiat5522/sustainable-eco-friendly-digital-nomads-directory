# 📊 Observability & Structured Logging – `app-next-directory`

The workspace standardizes on a single Pino-powered logger to capture structured JSON events with redacted secrets, replacing scattered `console.error` calls. This document summarizes the production configuration and verification status after the logging rollout.

## Logger Overview
- **Environment-aware**: `src/lib/logger.ts` adjusts log levels for development, production, and tests, and switches to pretty output locally without spawning worker threads. 【F:app-next-directory/src/lib/logger.ts†L1-L107】
- **Redaction & serialization**: Sensitive fields (passwords, tokens, cookies) are redacted automatically, and serializers normalize request/response payloads. 【F:app-next-directory/src/lib/logger.ts†L13-L53】
- **Context helpers**: `structuredLogger` exposes `debug`, `info`, `warn`, `error`, plus domain-specific helpers such as `apiError`, `authError`, `emailError`, `performance`, and `security`. 【F:app-next-directory/src/lib/logger.ts†L143-L213】
- **Request context**: `getRequestContext` extracts method, path, user-agent, and request ID for consistent tracing across handlers. 【F:app-next-directory/src/lib/logger.ts†L223-L232】

## Usage in the Codebase
- **Authentication flows**: Auth routes capture verification and reset failures via `structuredLogger.authError` and `emailError`. 【F:app-next-directory/app/api/auth/verify/route.ts†L8-L60】【F:app-next-directory/app/api/auth/request-password-reset/route.ts†L10-L55】
- **Content submission APIs**: Reviews, newsletter, and user analytics endpoints rely on `apiError` to emit normalized failure messages. 【F:app-next-directory/app/api/reviews/route.ts†L6-L229】【F:app-next-directory/app/api/newsletter/subscribe/route.ts†L1-L19】
- **Dashboards & admin tooling**: Admin analytics routes inject the logger through dependency parameters to guarantee audit trails. 【F:app-next-directory/app/api/admin/analytics/route.ts†L1-L20】【F:app-next-directory/app/api/user/dashboard/route.ts†L7-L80】

## Testing Status (✅ Completed)
- **Unit coverage**: `src/lib/__tests__/logger.test.ts` verifies every helper method, redaction behavior, and compatibility wrappers (`logError`, `getRequestContext`). 【F:app-next-directory/src/lib/__tests__/logger.test.ts†L1-L38】
- **Route regression tests**: API suites assert that logger helpers are invoked on failure paths, ensuring future changes preserve observability hooks. 【F:app-next-directory/app/api/auth/register/route.test.ts†L1-L52】【F:app-next-directory/app/api/user/dashboard/route.test.ts†L127-L156】

With the final testing phase complete (`pnpm test:unit`), all critical API handlers now emit structured logs, making it safe to pipe output into log aggregation platforms while preserving privacy.
