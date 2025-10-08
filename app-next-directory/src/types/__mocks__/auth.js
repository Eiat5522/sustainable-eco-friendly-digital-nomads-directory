const actual = jest.requireActual('../auth');

const mockHasPagePermission = jest.fn(() => true);
const mockHasFeaturePermission = jest.fn(() => true);

module.exports = {
  __esModule: true,
  ...actual,
  hasPagePermission: mockHasPagePermission,
  hasFeaturePermission: mockHasFeaturePermission,
};
