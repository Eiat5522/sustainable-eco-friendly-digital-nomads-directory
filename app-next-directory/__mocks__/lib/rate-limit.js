// A small helper to create mockable functions that support `.mockReturnValue`
// even when Jest's jest.fn isn't available due to ESM/CJS interop differences.
// Use Jest's mock functions directly to guarantee `.mockReturnValue` and
// other helpers are available in all test environments (CJS/ESM interop).
const { jest } = require('@jest/globals');

const mockModule = {
  getClientIP: jest.fn(() => '127.0.0.1'),
  isRateLimited: jest.fn(() => false),
  getRetryAfterMs: jest.fn(() => 60_000),
};

// Export a CJS object that also mimics an ESM namespace so both
// `import * as rateLimit` and `import rateLimit` receive the same mocks.
module.exports = {
  __esModule: true,
  ...mockModule,
  default: mockModule,
};
