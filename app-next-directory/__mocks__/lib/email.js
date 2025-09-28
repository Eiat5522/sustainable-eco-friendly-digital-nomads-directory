import jestGlobals from '@jest/globals';

const { jest } = jestGlobals;

export const buildVerifyEmail = jest.fn();
export const sendMail = jest.fn();

buildVerifyEmail.mockResolvedValue({
  to: 'test@example.com',
  subject: 'Verify your email',
  html: '<p>Test email</p>',
  text: 'Test email',
});
sendMail.mockResolvedValue({ messageId: 'test-message-id' });

export default {
  buildVerifyEmail,
  sendMail,
};
