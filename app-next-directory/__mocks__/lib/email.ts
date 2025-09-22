import { jest } from '@jest/globals';

export const sendMail = jest.fn();
export const buildVerifyEmail = jest.fn();

// Setup default returns
sendMail.mockResolvedValue({ messageId: 'test-message-id' });
buildVerifyEmail.mockResolvedValue({
  to: 'test@example.com',
  subject: 'Verify your email',
  html: '<p>Test email</p>',
  text: 'Test email'
});