// Mock for '@analytics/google-analytics' package
const mockGoogleAnalytics = jest.fn(() => ({
  name: 'google-analytics',
  config: {},
  initialize: jest.fn(),
  page: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
  loaded: jest.fn(() => true),
}));

module.exports = mockGoogleAnalytics;
module.exports.default = mockGoogleAnalytics;
