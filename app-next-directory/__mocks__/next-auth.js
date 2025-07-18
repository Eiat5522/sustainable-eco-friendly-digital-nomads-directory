// NextAuth v5 mock following the pattern from the research
const NextAuth = () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
});

// Mock the AuthError class
class AuthError extends Error {
  constructor(type) {
    super(type);
    this.type = type;
  }
}

// Export the mock
module.exports = NextAuth;
module.exports.AuthError = AuthError;
module.exports.default = NextAuth;