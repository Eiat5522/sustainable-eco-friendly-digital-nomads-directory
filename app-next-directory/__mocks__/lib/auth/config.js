import { fn } from 'jest-mock';

export const isEmailVerificationRequired = fn(() => false);
export const getAdminEmails = fn(() => []);
export const isAdminEmail = fn(() => false);

const authConfigMock = {
  isEmailVerificationRequired,
  getAdminEmails,
  isAdminEmail,
};

export default authConfigMock;
