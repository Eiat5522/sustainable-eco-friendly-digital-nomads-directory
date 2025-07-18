// Mock for next-auth/react
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
  SessionProvider: ({ children }) => children,
};