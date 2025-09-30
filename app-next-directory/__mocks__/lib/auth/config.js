import { jest } from '@jest/globals';

export const isEmailVerificationRequired = jest.fn();

isEmailVerificationRequired.mockReturnValue(false);

export default {
  isEmailVerificationRequired,
};
