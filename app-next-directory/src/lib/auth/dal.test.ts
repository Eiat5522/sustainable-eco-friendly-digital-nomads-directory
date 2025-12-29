import { jest } from '@jest/globals';

// Mocks
const mockConnect = jest.fn();
const mockHash = jest.fn();
const mockSync = jest.fn();
const mockFindOne = jest.fn();
const mockFindById = jest.fn();
const mockUpdateOne = jest.fn();
const mockCreate = jest.fn();
const mockExists = jest.fn();
const mockCountDocuments = jest.fn();
const mockIsValidObjectId = jest.fn();

const mockUserModel = {
  findOne: jest.fn((...args: unknown[]) => mockFindOne(...args)),
  findById: jest.fn((...args: unknown[]) => mockFindById(...args)),
  updateOne: jest.fn((...args: unknown[]) => mockUpdateOne(...args)),
  create: jest.fn((...args: unknown[]) => mockCreate(...args)),
  exists: jest.fn((...args: unknown[]) => mockExists(...args)),
  countDocuments: jest.fn((...args: unknown[]) => mockCountDocuments(...args)),
};

jest.mock('@/lib/dbConnect', () => jest.fn((...args: unknown[]) => mockConnect(...args)));
jest.mock('@/lib/auth/userService', () => ({ syncUserToSanity: (...args: unknown[]) => mockSync(...args) }));
jest.mock('mongoose', () => ({
  __esModule: true,
  isValidObjectId: (...args: unknown[]) => mockIsValidObjectId(...args),
}));
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: mockUserModel,
  ROLE_VALUES: ['user', 'editor', 'venueOwner', 'admin', 'superAdmin'],
  STATUS_VALUES: ['active', 'suspended', 'pending'],
  mockFindOne,
  mockFindById,
  mockUpdateOne,
  mockCreate,
  mockExists,
  mockCountDocuments,
}));

describe('auth DAL', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.doMock('mongoose', () => ({
      __esModule: true,
      isValidObjectId: (...args: unknown[]) => mockIsValidObjectId(...args),
    }));
    jest.doMock('@/models/User', () => ({
      __esModule: true,
      default: mockUserModel,
      ROLE_VALUES: ['user', 'editor', 'venueOwner', 'admin', 'superAdmin'],
      STATUS_VALUES: ['active', 'suspended', 'pending'],
      mockFindOne,
      mockFindById,
      mockUpdateOne,
      mockCreate,
      mockExists,
      mockCountDocuments,
    }));
    jest.doMock('bcryptjs', () => ({ hash: (...args: unknown[]) => mockHash(...args), default: { hash: mockHash } }));
    mockIsValidObjectId.mockReturnValue(true);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('createUser returns null when email already exists', async () => {
    const userModelModule = jest.requireMock('@/models/User');
    const { structuredLogger } = jest.requireMock('@/lib/logger');
    structuredLogger.debug('userModel module keys', { keys: Object.keys(userModelModule) });
    structuredLogger.debug('mockExists value', { mockExists: !!userModelModule.mockExists });
    const { mockExists } = userModelModule;
    mockExists.mockResolvedValue(true);

    const { createUser } = await import('./dal');

    const res = await createUser({ name: 'A', email: 'a@x.com', password: 'pw' });
    expect(res).toBeNull();
    expect(mockExists).toHaveBeenCalledWith('a@x.com');
  });

  it('createUser creates user and returns auth object', async () => {
    const { mockExists, mockCreate } = jest.requireMock('@/models/User');
    mockExists.mockResolvedValue(false);
    mockHash.mockResolvedValue('hashed_pw');
    const created = { _id: { toString: () => 'uid' }, name: 'A', email: 'a@x.com', role: 'user', status: 'active', sanityId: null };
    mockCreate.mockResolvedValue(created);
    mockSync.mockResolvedValue({ _id: 'sanity123' });

    const { createUser } = await import('./dal');
    const res = await createUser({ name: 'A', email: 'A@X.COM', password: 'pw' });

    expect(mockExists).toHaveBeenCalledWith('a@x.com');
    expect(mockHash).toHaveBeenCalledWith('pw', 12);
    expect(mockCreate).toHaveBeenCalled();
    expect(res).toMatchObject({ id: 'uid', email: 'a@x.com', name: 'A', role: 'user' });
  });

  it('updateUserProfile returns false when email is already used by another user', async () => {
    const { mockExists } = jest.requireMock('@/models/User');
    mockExists.mockResolvedValue(true);
    const { updateUserProfile } = await import('./dal');

    const res = await updateUserProfile('507f1f77bcf86cd799439011', { email: 'taken@example.com' });
    expect(res).toBe(false);
    expect(mockExists).toHaveBeenCalledWith({ email: 'taken@example.com', _id: { $ne: '507f1f77bcf86cd799439011' } });
  });

  it('updateUserProfile updates name/email and syncs to sanity', async () => {
    const { mockExists, mockUpdateOne, mockFindById } = jest.requireMock('@/models/User');
    mockExists.mockResolvedValue(false);
    mockUpdateOne.mockResolvedValue({ matchedCount: 1 });
    const dbUser = { _id: { toString: () => '507f1f77bcf86cd799439011' }, name: 'Old', email: 'old@example.com', role: 'user', sanityId: null };
    mockFindById.mockResolvedValue(dbUser);
    mockSync.mockResolvedValue({ _id: 'sanityNew' });

    const { updateUserProfile } = await import('./dal');
    const res = await updateUserProfile('507f1f77bcf86cd799439011', { name: 'New Name', email: ' New@Example.com ' });

    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011' }, { $set: { name: 'New Name', email: 'new@example.com' } }, { runValidators: true });
    expect(mockFindById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(mockSync).toHaveBeenCalled();
    expect(res).toBe(true);
  });
});
