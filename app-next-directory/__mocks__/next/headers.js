// Mock for next/headers
const cookies = jest.fn(() => ({
  get: jest.fn(() => undefined),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
  getAll: jest.fn(() => []),
}));

const headers = jest.fn(() => ({
  get: jest.fn(() => null),
  has: jest.fn(() => false),
  entries: jest.fn(() => []),
}));

module.exports = {
  cookies,
  headers,
};
