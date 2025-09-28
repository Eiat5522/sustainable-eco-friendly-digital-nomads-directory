// Enhanced mock for @auth/mongodb-adapter to prevent MongoDB connection attempts during Jest tests
const MongoDBAdapter = jest.fn().mockImplementation(() => ({
  createUser: jest.fn().mockResolvedValue({ id: 'mock-user-id' }),
  getUser: jest.fn().mockResolvedValue(null),
  getUserByEmail: jest.fn().mockResolvedValue(null),
  getUserByAccount: jest.fn().mockResolvedValue(null),
  updateUser: jest.fn().mockResolvedValue({ id: 'mock-user-id' }),
  deleteUser: jest.fn().mockResolvedValue(undefined),
  linkAccount: jest.fn().mockResolvedValue(undefined),
  unlinkAccount: jest.fn().mockResolvedValue(undefined),
  createSession: jest.fn().mockResolvedValue({ sessionToken: 'mock-session-token' }),
  getSessionAndUser: jest.fn().mockResolvedValue(null),
  updateSession: jest.fn().mockResolvedValue({ sessionToken: 'mock-session-token' }),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  createVerificationToken: jest.fn().mockResolvedValue(undefined),
  useVerificationToken: jest.fn().mockResolvedValue(null),
}));

globalThis.__mongoAdapterMock = MongoDBAdapter;

module.exports = {
  MongoDBAdapter,
};
