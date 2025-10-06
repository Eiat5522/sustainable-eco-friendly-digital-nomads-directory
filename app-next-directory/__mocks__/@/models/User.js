import { jest } from '@jest/globals';

// Create a complete Mongoose model mock
const mockSelect = jest.fn();
const mockLean = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockCreate = jest.fn();

// Set up the query chain
mockLean.mockResolvedValue(null);
mockSelect.mockReturnValue({ lean: mockLean });
mockFindOne.mockReturnValue({ select: mockSelect, lean: mockLean });

const UserModel = {
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
  create: mockCreate,
  // Export the individual mocks for test manipulation
  _mockSelect: mockSelect,
  _mockLean: mockLean,
  _mockFindOne: mockFindOne,
  _mockUpdateOne: mockUpdateOne,
  _mockCreate: mockCreate,
};

export { mockSelect, mockLean, mockFindOne, mockUpdateOne, mockCreate };
export default UserModel;
