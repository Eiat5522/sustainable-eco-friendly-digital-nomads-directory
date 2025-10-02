// Mock for @/lib/auth/serverAuth

// Provide sensible defaults while keeping jest.fn() flexibility for test overrides
const authenticateUser = jest.fn().mockResolvedValue({
  success: true,
  user: {
    id: 'test-user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    image: null,
  },
});

const createUserAccount = jest.fn().mockResolvedValue({
  success: true,
  userId: 'new-user-id-456',
  user: {
    id: 'new-user-id-456',
    email: 'newuser@example.com',
    name: 'New User',
    firstName: 'New',
    lastName: 'User',
    role: 'user',
    image: null,
  },
});

const getUserById = jest.fn().mockResolvedValue({
  id: 'test-user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  image: null,
  emailVerified: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
});

const updateUserRole = jest.fn().mockResolvedValue({
  success: true,
  message: 'User role updated successfully',
  user: {
    id: 'test-user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin', // Updated role
    image: null,
  },
});

const updateUserProfile = jest.fn().mockResolvedValue({
  success: true,
  message: 'Profile updated successfully',
  user: {
    id: 'test-user-id-123',
    email: 'test@example.com',
    name: 'Updated User',
    firstName: 'Updated',
    lastName: 'User',
    role: 'user',
    image: null,
  },
});

module.exports = {
  authenticateUser,
  createUserAccount,
  getUserById,
  updateUserRole,
  updateUserProfile,
};
