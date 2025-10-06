// Provide a small compatibility factory for creating mock functions that
// expose the minimal jest.fn-like API (mockReset, mockReturnValue,
// mockImplementation, and .mock.calls). This helps when tests or the
// runtime import the mock from different module systems (CJS/ESM) or when
// Jest's internal jest.fn instance isn't shared between contexts.
function createCompatMock(defaultImpl) {
  // If @jest/globals is available, prefer using jest.fn()
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { jest } = require('@jest/globals');
    if (jest && typeof jest.fn === 'function') {
      const m = jest.fn(defaultImpl);
      // Ensure basic methods exist (they do on real jest.fn)
      return m;
    }
  } catch (e) {
    // fall through to minimal shim
  }

  // Minimal shim that provides the common jest.fn API used in tests.
  function shim(...args) {
    shim.mock.calls.push(args);
    if (typeof shim._impl === 'function') return shim._impl(...args);
    if ('_return' in shim) return shim._return;
    if (typeof defaultImpl === 'function') return defaultImpl(...args);
    return undefined;
  }

  shim.mock = { calls: [] };
  shim.mockReset = () => {
    shim._impl = undefined;
    delete shim._return;
    shim.mock.calls.length = 0;
  };
  shim.mockReturnValue = (v) => {
    shim._return = v;
  };
  shim.mockImplementation = (fn) => {
    shim._impl = fn;
  };

  // Initialize defaults
  if (typeof defaultImpl === 'function') shim._impl = defaultImpl;

  return shim;
}

const isEmailVerificationRequired = createCompatMock(() => false);
const getAdminEmails = createCompatMock(() => []);
const isAdminEmail = createCompatMock(() => false);

// Create jest.fn() mocks for both named and default export compatibility
const { jest } = require('@jest/globals');

const isEmailVerificationRequired = jest.fn(() => false);
const getAdminEmails = jest.fn(() => []);
const isAdminEmail = jest.fn(() => false);

module.exports = {
  __esModule: true,
  default: {
    isEmailVerificationRequired,
    getAdminEmails,
    isAdminEmail,
  },
  isEmailVerificationRequired,
  getAdminEmails,
  isAdminEmail,
};

// Provide CommonJS compatibility so require() consumers and different
// module resolution paths receive the same mocked functions (helps with
// interop between CJS/ESM and different jest contexts).
module.exports = {
  __esModule: true,
  default: {
    isEmailVerificationRequired,
    getAdminEmails,
    isAdminEmail,
  },
  isEmailVerificationRequired,
  getAdminEmails,
  isAdminEmail,
};
