import { jest } from '@jest/globals';
import { Types } from 'mongoose';

// Mock dependencies
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();
const mockDbConnect = jest.fn();
const mockIsEmailVerificationRequired = jest.fn();
const mockIsValidObjectId = jest.fn();

// Mock User model
const mockUserModel = {
  findOne: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  updateOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

jest.mock('bcryptjs', () => ({
  default: {
    compare: mockBcryptCompare,
    hash: mockBcryptHash,
  },
  compare: mockBcryptCompare,
  hash: mockBcryptHash,
}));

jest.mock('@/lib/dbConnect', () => ({
  default: mockDbConnect,
}));

jest.mock('./config', () => ({
  isEmailVerificationRequired: mockIsEmailVerificationRequired,
}));

jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    Types: {
      ObjectId: class ObjectId {
        constructor(public value: string) {}
        toString() {
          return this.value;
        }
      },
    },
    isValidObjectId: mockIsValidObjectId,
  };
});

jest.mock('@/models/User', () => ({
  default: mockUserModel,
}));

describe('serverAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockDbConnect.mockResolvedValue(undefined);
    mockIsEmailVerificationRequired.mockReturnValue(false);
    mockIsValidObjectId.mockImplementation((id) => {
      return typeof id === 'string' && id.length === 24;
    });
  });

  describe('authenticateUser', () => {
    it('returns null when user is not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);

      const { authenticateUser } = await import('./serverAuth');
      const result = await authenticateUser('test@example.com', 'password123');

      expect(result).toBeNull();
      expect(mockDbConnect).toHaveBeenCalled();
    });

    it('normalizes email to lowercase and trims', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);

      const { authenticateUser } = await import('./serverAuth');
      await authenticateUser('  TEST@EXAMPLE.COM  ', 'password123');

      expect(mockUserModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    it('returns null when user has no password', async () => {
      const mockUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);

      const { authenticateUser } = await import('./serverAuth');
      const result = await authenticateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('returns null when password is invalid', async () => {
      const mockUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'user',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);
      mockBcryptCompare.mockResolvedValue(false);

      const { authenticateUser } = await import('./serverAuth');
      const result = await authenticateUser('test@example.com', 'wrong_password');

      expect(result).toBeNull();
      expect(mockBcryptCompare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
    });

    it('returns authenticated user when credentials are valid', async () => {
      const mockUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        image: 'https://example.com/avatar.jpg',
        role: 'user',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);
      mockBcryptCompare.mockResolvedValue(true);

      const { authenticateUser } = await import('./serverAuth');
      const result = await authenticateUser('test@example.com', 'correct_password');

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        role: 'user',
      });
    });

    it('requires email verification when configured', async () => {
      mockIsEmailVerificationRequired.mockReturnValue(true);

      const mockUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'user',
        emailVerified: null,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);
      mockBcryptCompare.mockResolvedValue(true);

      const { authenticateUser } = await import('./serverAuth');
      const result = await authenticateUser('test@example.com', 'password123');

      expect(result).toBeNull();
      expect(mockUserModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: expect.objectContaining({
            $exists: true,
            $ne: null,
            $type: 'date',
          }),
        })
      );
    });

    it('authenticates verified users when verification is required', async () => {
      mockIsEmailVerificationRequired.mockReturnValue(true);

      const mockUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'user',
        emailVerified: new Date(),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);
      mockBcryptCompare.mockResolvedValue(true);

      const { authenticateUser } = await import('./serverAuth');
      const result = await authenticateUser('test@example.com', 'password123');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
    });

    it('handles authentication errors gracefully', async () => {
      mockUserModel.findOne.mockImplementation(() => {
        throw new Error('Database error');
      });

      const { authenticateUser } = await import('./serverAuth');
      const result = await authenticateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });
  });

  describe('createUserAccount', () => {
    it('returns null when user already exists', async () => {
      mockUserModel.exists.mockResolvedValue({ _id: 'existing' });

      const { createUserAccount } = await import('./serverAuth');
      const result = await createUserAccount({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBeNull();
    });

    it('normalizes email to lowercase before checking existence', async () => {
      mockUserModel.exists.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed_password');
      mockUserModel.create.mockResolvedValue({
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      const { createUserAccount } = await import('./serverAuth');
      await createUserAccount({
        name: 'Test User',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
      });

      expect(mockUserModel.exists).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('hashes password before storing', async () => {
      mockUserModel.exists.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed_password');
      mockUserModel.create.mockResolvedValue({
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      const { createUserAccount } = await import('./serverAuth');
      await createUserAccount({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 12);
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed_password',
        })
      );
    });

    it('creates user with default role', async () => {
      mockUserModel.exists.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed_password');
      mockUserModel.create.mockResolvedValue({
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      const { createUserAccount } = await import('./serverAuth');
      const result = await createUserAccount({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        image: undefined,
        role: 'user',
      });
    });

    it('creates user with optional image', async () => {
      mockUserModel.exists.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed_password');
      mockUserModel.create.mockResolvedValue({
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        role: 'user',
      });

      const { createUserAccount } = await import('./serverAuth');
      const result = await createUserAccount({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        image: 'https://example.com/avatar.jpg',
      });

      expect(result?.image).toBe('https://example.com/avatar.jpg');
    });

    it('handles creation errors gracefully', async () => {
      mockUserModel.exists.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed_password');
      mockUserModel.create.mockRejectedValue(new Error('Database error'));

      const { createUserAccount } = await import('./serverAuth');
      const result = await createUserAccount({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('returns null for invalid ObjectId', async () => {
      mockIsValidObjectId.mockReturnValue(false);

      const { getUserById } = await import('./serverAuth');
      const result = await getUserById('invalid-id');

      expect(result).toBeNull();
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });

    it('returns null when user is not found', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockUserModel.findById.mockReturnValue(mockQuery);

      const { getUserById } = await import('./serverAuth');
      const result = await getUserById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });

    it('returns user data when found', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      const mockUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        role: 'user',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockReturnValue(mockQuery);

      const { getUserById } = await import('./serverAuth');
      const result = await getUserById('507f1f77bcf86cd799439011');

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        role: 'user',
      });
    });

    it('handles database errors gracefully', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      const { getUserById } = await import('./serverAuth');
      const result = await getUserById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });

  describe('updateUserRole', () => {
    it('returns false for invalid ObjectId', async () => {
      mockIsValidObjectId.mockReturnValue(false);

      const { updateUserRole } = await import('./serverAuth');
      const result = await updateUserRole('invalid-id', 'admin' as any);

      expect(result).toBe(false);
      expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    });

    it('updates user role successfully', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.updateOne.mockResolvedValue({ matchedCount: 1 });

      const { updateUserRole } = await import('./serverAuth');
      const result = await updateUserRole('507f1f77bcf86cd799439011', 'admin' as any);

      expect(result).toBe(true);
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        { $set: { role: 'admin' } },
        { runValidators: true }
      );
    });

    it('returns false when user is not found', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.updateOne.mockResolvedValue({ matchedCount: 0 });

      const { updateUserRole } = await import('./serverAuth');
      const result = await updateUserRole('507f1f77bcf86cd799439011', 'admin' as any);

      expect(result).toBe(false);
    });

    it('handles update errors gracefully', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.updateOne.mockRejectedValue(new Error('Database error'));

      const { updateUserRole } = await import('./serverAuth');
      const result = await updateUserRole('507f1f77bcf86cd799439011', 'admin' as any);

      expect(result).toBe(false);
    });
  });

  describe('unfavoriteListing', () => {
    it('does nothing for invalid userId', async () => {
      mockIsValidObjectId.mockImplementation((id) => id === 'valid-listing-id');

      const { unfavoriteListing } = await import('./serverAuth');
      await unfavoriteListing('invalid-user-id', 'valid-listing-id');

      expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    });

    it('does nothing for invalid listingId', async () => {
      mockIsValidObjectId.mockImplementation((id) => id === 'valid-user-id');

      const { unfavoriteListing } = await import('./serverAuth');
      await unfavoriteListing('valid-user-id', 'invalid-listing-id');

      expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    });

    it('removes listing from favorites', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.updateOne.mockResolvedValue({ matchedCount: 1 });

      const { unfavoriteListing } = await import('./serverAuth');
      await unfavoriteListing('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439022');

      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        { $pull: { favorites: '507f1f77bcf86cd799439022' } }
      );
    });

    it('handles errors gracefully without throwing', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.updateOne.mockRejectedValue(new Error('Database error'));

      const { unfavoriteListing } = await import('./serverAuth');
      
      // Should not throw
      await expect(
        unfavoriteListing('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439022')
      ).resolves.not.toThrow();
    });
  });

  describe('updateUserProfile', () => {
    it('returns null for invalid ObjectId', async () => {
      mockIsValidObjectId.mockReturnValue(false);

      const { updateUserProfile } = await import('./serverAuth');
      const result = await updateUserProfile('invalid-id', { name: 'New Name' });

      expect(result).toBeNull();
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('returns null when no fields to update', async () => {
      mockIsValidObjectId.mockReturnValue(true);

      const { updateUserProfile } = await import('./serverAuth');
      const result = await updateUserProfile('507f1f77bcf86cd799439011', {});

      expect(result).toBeNull();
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('updates user name', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      const mockUpdatedUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Updated Name',
        email: 'test@example.com',
        role: 'user',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const { updateUserProfile } = await import('./serverAuth');
      const result = await updateUserProfile('507f1f77bcf86cd799439011', {
        name: 'Updated Name',
      });

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $set: { name: 'Updated Name' } },
        { new: true }
      );
      expect(result?.name).toBe('Updated Name');
    });

    it('updates user image to a new value', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      const mockUpdatedUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/new-avatar.jpg',
        role: 'user',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const { updateUserProfile } = await import('./serverAuth');
      const result = await updateUserProfile('507f1f77bcf86cd799439011', {
        image: 'https://example.com/new-avatar.jpg',
      });

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $set: { image: 'https://example.com/new-avatar.jpg' } },
        { new: true }
      );
      expect(result?.image).toBe('https://example.com/new-avatar.jpg');
    });

    it('updates user image to null', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      const mockUpdatedUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test User',
        email: 'test@example.com',
        image: null,
        role: 'user',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const { updateUserProfile } = await import('./serverAuth');
      const result = await updateUserProfile('507f1f77bcf86cd799439011', {
        image: null,
      });

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $set: { image: null } },
        { new: true }
      );
    });

    it('updates multiple fields at once', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      const mockUpdatedUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Updated Name',
        email: 'test@example.com',
        image: 'https://example.com/new-avatar.jpg',
        role: 'user',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const { updateUserProfile } = await import('./serverAuth');
      const result = await updateUserProfile('507f1f77bcf86cd799439011', {
        name: 'Updated Name',
        image: 'https://example.com/new-avatar.jpg',
      });

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          $set: {
            name: 'Updated Name',
            image: 'https://example.com/new-avatar.jpg',
          },
        },
        { new: true }
      );
      expect(result?.name).toBe('Updated Name');
      expect(result?.image).toBe('https://example.com/new-avatar.jpg');
    });

    it('returns null when user is not found', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const { updateUserProfile } = await import('./serverAuth');
      const result = await updateUserProfile('507f1f77bcf86cd799439011', {
        name: 'Updated Name',
      });

      expect(result).toBeNull();
    });

    it('handles update errors gracefully', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.findByIdAndUpdate.mockImplementation(() => {
        throw new Error('Database error');
      });

      const { updateUserProfile } = await import('./serverAuth');
      const result = await updateUserProfile('507f1f77bcf86cd799439011', {
        name: 'Updated Name',
      });

      expect(result).toBeNull();
    });
  });
});
