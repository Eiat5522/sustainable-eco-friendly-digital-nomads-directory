// Mock for next-auth/jwt
module.exports = {
  getToken: jest.fn(() => Promise.resolve(null)),
  encode: jest.fn(() => Promise.resolve('mock-token')),
  decode: jest.fn(() => Promise.resolve(null)),
};