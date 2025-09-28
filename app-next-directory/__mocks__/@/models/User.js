import { jest } from '@jest/globals';

// Create a complete Mongoose model mock
const mockSelect = jest.fn();
const mockLean = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();

// Set up the query chain
mockLean.mockResolvedValue(null);
mockSelect.mockReturnValue({ lean: mockLean });
mockFindOne.mockReturnValue({ select: mockSelect, lean: mockLean });

const UserModel = {
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
  // Export the individual mocks for test manipulation
  _mockSelect: mockSelect,
  _mockLean: mockLean,
  _mockFindOne: mockFindOne,
  _mockUpdateOne: mockUpdateOne,
};

export { mockSelect, mockLean, mockFindOne, mockUpdateOne };
export default UserModel;