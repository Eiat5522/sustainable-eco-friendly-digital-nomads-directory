const actual = jest.requireActual('../auth');

const mockHasPagePermission = jest.fn();
const mockHasFeaturePermission = jest.fn();

module.exports = {
  __esModule: true,
  ...actual,
  hasPagePermission: mockHasPagePermission,
  hasFeaturePermission: mockHasFeaturePermission,
  mockHasPagePermission,
  mockHasFeaturePermission,
};
