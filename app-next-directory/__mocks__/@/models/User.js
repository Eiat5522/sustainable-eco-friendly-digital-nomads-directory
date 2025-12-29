const { jest } = require('@jest/globals');

const mockSelect = jest.fn();
const mockLean = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockCreate = jest.fn();
const mockExists = jest.fn();
const mockFindById = jest.fn();

mockLean.mockResolvedValue(null);
mockSelect.mockReturnValue({ lean: mockLean });
mockFindOne.mockReturnValue({ select: mockSelect, lean: mockLean });
mockFindById.mockResolvedValue(null);

const UserModel = {
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
  create: mockCreate,
  exists: mockExists,
  findById: mockFindById,
  _mockSelect: mockSelect,
  _mockLean: mockLean,
  _mockFindOne: mockFindOne,
  _mockUpdateOne: mockUpdateOne,
  _mockCreate: mockCreate,
  _mockExists: mockExists,
  _mockFindById: mockFindById,
};

module.exports = {
  __esModule: true,
  default: UserModel,
  mockSelect,
  mockLean,
  mockFindOne,
  mockUpdateOne,
  mockCreate,
  mockExists,
  mockFindById,
};
