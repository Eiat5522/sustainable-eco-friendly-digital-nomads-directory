import { jest } from '@jest/globals';

export const isEmailVerificationRequired = jest.fn();

// Setup default return
isEmailVerificationRequired.mockReturnValue(false);