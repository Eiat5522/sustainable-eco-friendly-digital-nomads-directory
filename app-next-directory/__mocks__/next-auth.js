// A minimal mock for next-auth
module.exports = {
  getServerSession: jest.fn(() => Promise.resolve(null)), // Or return a mock session object
  // Add other exports from next-auth if needed by your tests
  // e.g., NextAuth: jest.fn(() => ({})),
};
