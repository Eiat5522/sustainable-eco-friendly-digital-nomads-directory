# Upstash Redis Auth Integration

Upstash Redis is now wired up for login rate limiting. Provide the following environment variables to enable the limiter:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The limiter uses a 5-attempt sliding window and gracefully falls back to a no-op implementation if the credentials are missing. Sessions themselves remain JWT-based (no Redis storage required) to keep the Credentials provider compatible with Auth.js restrictions.

Credential-based sign-ins are guarded by the Redis sliding-window rate limiter. Each attempt is tracked in the `loginAttempts` collection for short-term auditability (TTL of 15 minutes via existing indexes). A rate-limited attempt returns an error message of `Too many login attempts. Please try again later.`

**Recommended defaults**

- 5 attempts per email/IP pair per minute (current configuration).
- Ensure your Upstash plan allows the anticipated request volume for rate-limit checks from both Edge and Node handlers.

For local development, add the credentials to `.env.local` or `.env.development`. In deployed environments, configure the variables via your platform's secrets management (e.g., Vercel environment variables):

UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
