// Mock for @/lib/auth/serverAuth
console.log('[MOCK] Loading serverAuth mock, jest type:', typeof jest);
console.log('[MOCK] jest.fn type:', typeof jest?.fn);

const authenticateUser = jest.fn();
const createUserAccount = jest.fn();
const getUserById = jest.fn();
const updateUserRole = jest.fn();
const updateUserProfile = jest.fn();

console.log('[MOCK] updateUserProfile type:', typeof updateUserProfile);
console.log('[MOCK] updateUserProfile.mockResolvedValue:', typeof updateUserProfile.mockResolvedValue);

module.exports = {
  authenticateUser,
  createUserAccount,
  getUserById,
  updateUserRole,
  updateUserProfile,
};
