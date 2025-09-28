import jestGlobals from '@jest/globals';

const { jest } = jestGlobals;

export const isEmailVerificationRequired = jest.fn(() => false);

export default {
  isEmailVerificationRequired,
};
