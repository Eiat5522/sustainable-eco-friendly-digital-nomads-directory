const actual = jest.requireActual('../auth');

const mockHasPagePermission = jest.fn(actual.hasPagePermission);
const mockHasFeaturePermission = jest.fn(actual.hasFeaturePermission);

module.exports = {
  __esModule: true,
  ...actual,
  hasPagePermission: mockHasPagePermission,
  hasFeaturePermission: mockHasFeaturePermission,
  mockHasPagePermission,
  mockHasFeaturePermission,
};
