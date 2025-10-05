// Mock for 'analytics' npm package
const mockAnalytics = jest.fn(() => ({
  page: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  getState: jest.fn(() => ({})),
  storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

module.exports = mockAnalytics;
module.exports.default = mockAnalytics;
