import { jest } from '@jest/globals';

export const isEmailVerificationRequired = jest.fn();
export const getAdminEmails = jest.fn();
export const isAdminEmail = jest.fn();

isEmailVerificationRequired.mockReturnValue(false);
getAdminEmails.mockReturnValue([]);
isAdminEmail.mockReturnValue(false);

export default {
  isEmailVerificationRequired,
  getAdminEmails,
  isAdminEmail,
};
