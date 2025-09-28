import jestGlobals from '@jest/globals';

const { jest } = jestGlobals;

export const buildVerifyEmail = jest.fn();
export const sendMail = jest.fn();

buildVerifyEmail.mockImplementation(() =>
  Promise.resolve({
    to: 'test@example.com',
    subject: 'Verify your email',
    html: '<p>Test email</p>',
    text: 'Test email',
  }),
);
sendMail.mockImplementation(() =>
  Promise.resolve({ messageId: 'test-message-id' }),
);

export default {
  buildVerifyEmail,
  sendMail,
};
