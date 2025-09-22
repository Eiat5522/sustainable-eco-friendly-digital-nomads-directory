import { jest } from '@jest/globals';

const mockUserModel = {
  findOne: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  updateOne: jest.fn(),
};

const mockDbConnect = jest.fn();
const mockIsEmailVerificationRequired = jest.fn();
const mockIsValidObjectId = jest.fn();
const mockBcrypt = {
  compare: jest.fn(),
  hash: jest.fn(),
};

jest.mock('../../models/User', () => ({
  __esModule: true,
  default: mockUserModel,
}));

jest.mock('../dbConnect', () => ({
  __esModule: true,
  default: mockDbConnect,
}));

jest.mock('bcryptjs', () => mockBcrypt);

jest.mock('./config', () => ({
  __esModule: true,
  isEmailVerificationRequired: mockIsEmailVerificationRequired,
}));

jest.mock('mongoose', () => ({
  __esModule: true,
  Types: {
    ObjectId: class {
      constructor(private readonly value: string) {}

      toString() {
        return this.value;
      }
    },
  },
  isValidObjectId: mockIsValidObjectId,
}));

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

const {
  authenticateUser,
  createUserAccount,
  getUserById,
  updateUserRole,
} = require('./serverAuth');

function resetMocks() {
  jest.clearAllMocks();
  mockDbConnect.mockResolvedValue(undefined);
  mockIsEmailVerificationRequired.mockReturnValue(false);
  mockIsValidObjectId.mockReturnValue(true);
}

function mockFindOneResult(result: any) {
  const lean = jest.fn().mockResolvedValue(result);
  const select = jest.fn().mockReturnValue({ lean });
  mockUserModel.findOne.mockReturnValue({ select, lean });
  return { select, lean };
}

function mockFindByIdResult(result: any) {
  const lean = jest.fn().mockResolvedValue(result);
  const select = jest.fn().mockReturnValue({ lean });
  mockUserModel.findById.mockReturnValue({ select, lean });
  return { select, lean };
}

describe('serverAuth utilities', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('authenticateUser', () => {
    it('returns authenticated user when credentials are valid', async () => {
      const userDoc = {
        _id: { toString: () => '123' },
        name: 'John',
        email: 'john@example.com',
        image: 'avatar.png',
        role: 'admin',
        password: 'hashed',
        emailVerified: new Date(),
      };
      mockFindOneResult(userDoc);
      mockBcrypt.compare.mockResolvedValue(true);

      const user = await authenticateUser(' John@example.com ', 'password123');

      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(user).toEqual({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        image: 'avatar.png',
        role: 'admin',
      });
    });

    it('enforces email verification when required', async () => {
      mockIsEmailVerificationRequired.mockReturnValue(true);
      const userDoc = {
        _id: { toString: () => '123' },
        name: 'Verified',
        email: 'verified@example.com',
        image: null,
        role: 'user',
        password: 'hashed',
        emailVerified: new Date(),
      };
      const { select } = mockFindOneResult(userDoc);
      mockBcrypt.compare.mockResolvedValue(true);

      const user = await authenticateUser('verified@example.com', 'password');

      expect(select).toHaveBeenCalledWith('_id name email image role +password +emailVerified');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'verified@example.com',
        emailVerified: { $exists: true, $ne: null, $type: 'date' },
      });
      expect(user?.role).toBe('user');
    });

    it('returns null when verification required but user not verified', async () => {
      mockIsEmailVerificationRequired.mockReturnValue(true);
      const userDoc = {
        _id: { toString: () => '123' },
        name: 'Pending',
        email: 'pending@example.com',
        image: null,
        role: 'user',
        password: 'hashed',
        emailVerified: null,
      };
      mockFindOneResult(userDoc);

      const user = await authenticateUser('pending@example.com', 'password');
      expect(user).toBeNull();
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('returns null when user is missing or password absent', async () => {
      mockFindOneResult(null);
      expect(await authenticateUser('missing@example.com', 'pass')).toBeNull();

      mockFindOneResult({
        _id: { toString: () => 'id' },
        name: 'NoPassword',
        email: 'nopass@example.com',
        role: 'user',
      });
      expect(await authenticateUser('nopass@example.com', 'pass')).toBeNull();
    });

    it('returns null when password comparison fails', async () => {
      mockFindOneResult({
        _id: { toString: () => '123' },
        name: 'John',
        email: 'john@example.com',
        image: 'avatar.png',
        role: 'user',
        password: 'hashed',
      });
      mockBcrypt.compare.mockResolvedValue(false);

      expect(await authenticateUser('john@example.com', 'wrong')).toBeNull();
    });

    it('handles errors gracefully', async () => {
      mockUserModel.findOne.mockImplementation(() => {
        throw new Error('db failure');
      });

      expect(await authenticateUser('error@example.com', 'password')).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
    });
  });

  describe('createUserAccount', () => {
    it('creates a new user with normalized email', async () => {
      mockUserModel.exists.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockUserModel.create.mockResolvedValue({
        _id: { toString: () => '987' },
        name: 'New User',
        email: 'new@example.com',
        image: 'avatar',
        role: 'user',
      });

      const result = await createUserAccount({
        name: 'New User',
        email: ' New@Example.com ',
        password: 'secret',
        image: 'avatar',
      });

      expect(mockUserModel.exists).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'hashed-password',
        image: 'avatar',
        role: 'user',
      });
      expect(result).toEqual({
        id: '987',
        name: 'New User',
        email: 'new@example.com',
        image: 'avatar',
        role: 'user',
      });
    });

    it('returns null when user already exists', async () => {
      mockUserModel.exists.mockResolvedValue(true);

      const result = await createUserAccount({
        name: 'Existing',
        email: 'existing@example.com',
        password: 'secret',
      });

      expect(result).toBeNull();
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('returns null when creation fails', async () => {
      mockUserModel.exists.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed');
      mockUserModel.create.mockRejectedValue(new Error('insert failed'));

      const result = await createUserAccount({
        name: 'Fail',
        email: 'fail@example.com',
        password: 'secret',
      });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('User creation error:', expect.any(Error));
    });
  });

  describe('getUserById', () => {
    it('returns null for invalid object id', async () => {
      mockIsValidObjectId.mockReturnValue(false);

      expect(await getUserById('invalid')).toBeNull();
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });

    it('returns null when user is not found', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockFindByIdResult(null);

      expect(await getUserById('507f1f77bcf86cd799439011')).toBeNull();
    });

    it('returns user when found', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      const userDoc = {
        _id: { toString: () => '123' },
        name: 'Lookup',
        email: 'lookup@example.com',
        image: 'img',
        role: 'admin',
      };
      mockFindByIdResult(userDoc);

      const result = await getUserById('507f1f77bcf86cd799439011');
      expect(result).toEqual({
        id: '123',
        name: 'Lookup',
        email: 'lookup@example.com',
        image: 'img',
        role: 'admin',
      });
    });

    it('handles errors gracefully', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.findById.mockImplementation(() => {
        throw new Error('find error');
      });

      expect(await getUserById('507f1f77bcf86cd799439011')).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Get user error:', expect.any(Error));
    });
  });

  describe('updateUserRole', () => {
    it('returns false for invalid object id', async () => {
      mockIsValidObjectId.mockReturnValue(false);

      expect(await updateUserRole('invalid', 'admin')).toBe(false);
      expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    });

    it('returns true when update succeeds', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.updateOne.mockResolvedValue({ matchedCount: 1 });

      expect(await updateUserRole('507f1f77bcf86cd799439011', 'admin')).toBe(true);
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        { $set: { role: 'admin' } },
        { runValidators: true },
      );
    });

    it('returns false when no documents are updated', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.updateOne.mockResolvedValue({ matchedCount: 0 });

      expect(await updateUserRole('507f1f77bcf86cd799439012', 'user')).toBe(false);
    });

    it('handles errors gracefully', async () => {
      mockIsValidObjectId.mockReturnValue(true);
      mockUserModel.updateOne.mockRejectedValue(new Error('update failed'));

      expect(await updateUserRole('507f1f77bcf86cd799439013', 'user')).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Update user role error:', expect.any(Error));
    });
  });
});
