import { fn } from 'jest-mock';

export const buildVerifyEmail = fn(() =>
  Promise.resolve({
    to: 'test@example.com',
    subject: 'Verify your email',
    html: '<p>Test email</p>',
    text: 'Test email',
  })
);

export const sendMail = fn(() => Promise.resolve({ messageId: 'test-message-id' }));

const emailMock = {
  buildVerifyEmail,
  sendMail,
};

export default emailMock;
