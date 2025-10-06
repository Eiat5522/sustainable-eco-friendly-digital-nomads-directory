import { jest } from '@jest/globals';

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

const emailMock = {
  buildVerifyEmail,
  sendMail,
};

export default emailMock;

// CommonJS compatibility
module.exports = {
  __esModule: true,
  default: emailMock,
  buildVerifyEmail,
  sendMail,
};
