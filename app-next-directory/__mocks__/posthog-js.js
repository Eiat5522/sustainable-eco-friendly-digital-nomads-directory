// Mock for 'posthog-js' package
const mockPosthog = {
  init: jest.fn(),
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  debug: jest.fn(),
  opt_in_capturing: jest.fn(),
  opt_out_capturing: jest.fn(),
  has_opted_in_capturing: jest.fn(() => true),
  has_opted_out_capturing: jest.fn(() => false),
  register: jest.fn(),
  unregister: jest.fn(),
  people: {
    set: jest.fn(),
  },
};

module.exports = mockPosthog;
module.exports.default = mockPosthog;
