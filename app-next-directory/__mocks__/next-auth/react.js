// Mock for next-auth/react
const React = require('react');

const SessionContext = React.createContext(undefined);

module.exports = {
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
  getSession: jest.fn(() => Promise.resolve(null)),
  getCsrfToken: jest.fn(() => Promise.resolve('mock-csrf-token')),
  getProviders: jest.fn(() => Promise.resolve({})),
  SessionContext,
  SessionProvider: ({ children }) => children,
};
