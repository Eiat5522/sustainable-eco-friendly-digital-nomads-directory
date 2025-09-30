// A small helper to create mockable functions that support `.mockReturnValue`
// even when Jest's jest.fn isn't available due to ESM/CJS interop differences.
// Use Jest's mock functions directly to guarantee `.mockReturnValue` and
// other helpers are available in all test environments (CJS/ESM interop).
const { jest } = require('@jest/globals');

const getClientIp = jest.fn(() => '127.0.0.1');
const isRateLimited = jest.fn(() => false);
const getRetryAfterMs = jest.fn(() => 60_000);

const exported = { getClientIp, isRateLimited, getRetryAfterMs };

// Export a CJS object that also mimics an ESM namespace
module.exports = { __esModule: true, default: exported };
module.exports.getClientIp = getClientIp;
module.exports.isRateLimited = isRateLimited;
module.exports.getRetryAfterMs = getRetryAfterMs;

// Also ensure the default namespace exposes the same named mocks so both
// `import * as rateLimitModule from '@/lib/rate-limit'` and
// `import rateLimit from '@/lib/rate-limit'` get the mock functions.
if (module.exports.default) {
  module.exports.default.getClientIp = getClientIp;
  module.exports.default.isRateLimited = isRateLimited;
  module.exports.default.getRetryAfterMs = getRetryAfterMs;
}

// Also expose named exports via `exports` for compatibility
exports.getClientIp = getClientIp;
exports.isRateLimited = isRateLimited;
exports.getRetryAfterMs = getRetryAfterMs;
