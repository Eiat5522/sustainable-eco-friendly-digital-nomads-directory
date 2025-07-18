// Mock for next-auth/providers/credentials
const Credentials = jest.fn((config) => ({
  id: 'credentials',
  name: 'Credentials',
  type: 'credentials',
  credentials: config?.credentials || {},
  authorize: config?.authorize || jest.fn(),
}));

module.exports = Credentials;
module.exports.default = Credentials;