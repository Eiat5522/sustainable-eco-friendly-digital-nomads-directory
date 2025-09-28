import { jest } from '@jest/globals';

// Named export used in tests. Keep implementation minimal and valid JS.
export const isEmailVerificationRequired = jest.fn(() => false);

// Optionally export a default object for compatibility with different import styles
const _default = {
  isEmailVerificationRequired,
};

export default _default;
