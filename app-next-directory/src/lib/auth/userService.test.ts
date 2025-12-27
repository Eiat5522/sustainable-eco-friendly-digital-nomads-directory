import { jest } from '@jest/globals';

// Mock dependencies before importing the module
const mockSanityClient = {
  fetch: jest.fn(),
  create: jest.fn(),
  patch: jest.fn(),
};

const mockPatchBuilder = {
  set: jest.fn(),
  commit: jest.fn(),
};

const mockBcryptHash = jest.fn();
const mockStructuredLogger = {
  error: jest.fn(),
};

jest.mock('next-sanity', () => ({
  createClient: jest.fn(() => mockSanityClient),
}));

jest.mock('bcryptjs', () => ({
  default: {
    hash: mockBcryptHash,
  },
  hash: mockBcryptHash,
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: mockStructuredLogger,
}));

describe('userService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
    process.env.SANITY_API_TOKEN = 'test-token';

    // Setup patch builder chain
    mockPatchBuilder.set.mockReturnValue(mockPatchBuilder);
    mockPatchBuilder.commit.mockResolvedValue({ _id: 'user123' });
    mockSanityClient.patch.mockReturnValue(mockPatchBuilder);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('findSanityUserByEmail', () => {
    it('returns null when email is not provided', async () => {
      const { findSanityUserByEmail } = await import('./userService');

      const result = await findSanityUserByEmail('');
      expect(result).toBeNull();
      expect(mockSanityClient.fetch).not.toHaveBeenCalled();
    });

    it('fetches user by email from Sanity', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };
      mockSanityClient.fetch.mockResolvedValue(mockUser);

      const { findSanityUserByEmail } = await import('./userService');
      const result = await findSanityUserByEmail('test@example.com');

      expect(mockSanityClient.fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "user" && email == $email][0]'),
        { email: 'test@example.com' }
      );
      expect(result).toEqual(mockUser);
    });

    it('handles errors and returns null', async () => {
      mockSanityClient.fetch.mockRejectedValue(new Error('Sanity error'));

      const { findSanityUserByEmail } = await import('./userService');
      const result = await findSanityUserByEmail('test@example.com');

      expect(result).toBeNull();
      expect(mockStructuredLogger.error).toHaveBeenCalledWith(
        'Error finding Sanity user by email',
        expect.any(Error),
        expect.objectContaining({
          component: 'user-service',
          operation: 'find_by_email',
        })
      );
    });
  });

  describe('findSanityUserById', () => {
    it('returns null when id is not provided', async () => {
      const { findSanityUserById } = await import('./userService');

      const result = await findSanityUserById('');
      expect(result).toBeNull();
      expect(mockSanityClient.fetch).not.toHaveBeenCalled();
    });

    it('fetches user by ID from Sanity', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };
      mockSanityClient.fetch.mockResolvedValue(mockUser);

      const { findSanityUserById } = await import('./userService');
      const result = await findSanityUserById('user123');

      expect(mockSanityClient.fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "user" && _id == $id][0]'),
        { id: 'user123' }
      );
      expect(result).toEqual(mockUser);
    });

    it('handles errors and returns null', async () => {
      mockSanityClient.fetch.mockRejectedValue(new Error('Sanity error'));

      const { findSanityUserById } = await import('./userService');
      const result = await findSanityUserById('user123');

      expect(result).toBeNull();
      expect(mockStructuredLogger.error).toHaveBeenCalledWith(
        'Error finding Sanity user by ID',
        expect.any(Error),
        expect.objectContaining({
          userId: 'user123',
          component: 'user-service',
          operation: 'find_by_id',
        })
      );
    });
  });

  describe('createSanityUser', () => {
    it('throws error when email is missing', async () => {
      const { createSanityUser } = await import('./userService');

      await expect(createSanityUser({ name: 'Test', email: '', role: 'user' })).rejects.toThrow(
        'Name and email are required to create a user'
      );
    });

    it('throws error when name is missing', async () => {
      const { createSanityUser } = await import('./userService');

      await expect(
        createSanityUser({ name: '', email: 'test@example.com', role: 'user' })
      ).rejects.toThrow('Name and email are required to create a user');
    });

    it('returns existing user if already exists', async () => {
      const existingUser = { _id: 'user123', email: 'test@example.com' };
      mockSanityClient.fetch.mockResolvedValue(existingUser);

      const { createSanityUser } = await import('./userService');
      const result = await createSanityUser({
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      expect(result).toEqual(existingUser);
      expect(mockSanityClient.create).not.toHaveBeenCalled();
    });

    it('creates new user in Sanity with all fields', async () => {
      mockSanityClient.fetch.mockResolvedValue(null); // User doesn't exist
      const newUser = { _id: 'user123', email: 'test@example.com' };
      mockSanityClient.create.mockResolvedValue(newUser);

      const { createSanityUser } = await import('./userService');
      const result = await createSanityUser({
        name: 'Test User',
        email: 'test@example.com',
        bio: 'Test bio',
        role: 'admin',
        avatar: 'avatar123',
      });

      expect(mockSanityClient.create).toHaveBeenCalledWith({
        _type: 'user',
        name: 'Test User',
        email: 'test@example.com',
        bio: 'Test bio',
        role: 'admin',
        status: 'active',
        createdAt: expect.any(String),
        avatar: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: 'avatar123',
          },
        },
      });
      expect(result).toEqual(newUser);
    });

    it('creates new user without optional fields', async () => {
      mockSanityClient.fetch.mockResolvedValue(null);
      const newUser = { _id: 'user123', email: 'test@example.com' };
      mockSanityClient.create.mockResolvedValue(newUser);

      const { createSanityUser } = await import('./userService');
      const result = await createSanityUser({
        name: 'Test User',
        email: 'test@example.com',
      });

      expect(mockSanityClient.create).toHaveBeenCalledWith({
        _type: 'user',
        name: 'Test User',
        email: 'test@example.com',
        bio: '',
        role: 'user',
        status: 'active',
        createdAt: expect.any(String),
      });
      expect(result).toEqual(newUser);
    });

    it('handles creation errors and logs them', async () => {
      mockSanityClient.fetch.mockResolvedValue(null);
      const error = new Error('Creation failed');
      mockSanityClient.create.mockRejectedValue(error);

      const { createSanityUser } = await import('./userService');

      await expect(
        createSanityUser({
          name: 'Test User',
          email: 'test@example.com',
        })
      ).rejects.toThrow('Creation failed');

      expect(mockStructuredLogger.error).toHaveBeenCalledWith(
        'Error creating Sanity user',
        error,
        expect.objectContaining({
          component: 'user-service',
          operation: 'create_user',
        })
      );
    });
  });

  describe('updateSanityUserWithAuthDetails', () => {
    it('returns null when userId is not provided', async () => {
      const { updateSanityUserWithAuthDetails } = await import('./userService');

      const result = await updateSanityUserWithAuthDetails('', { name: 'Test' });
      expect(result).toBeNull();
      expect(mockSanityClient.patch).not.toHaveBeenCalled();
    });

    it('updates user name', async () => {
      const { updateSanityUserWithAuthDetails } = await import('./userService');

      await updateSanityUserWithAuthDetails('user123', { name: 'Updated Name' });

      expect(mockSanityClient.patch).toHaveBeenCalledWith('user123');
      expect(mockPatchBuilder.set).toHaveBeenCalledWith({ name: 'Updated Name' });
      expect(mockPatchBuilder.commit).toHaveBeenCalled();
    });

    it('updates user role', async () => {
      const { updateSanityUserWithAuthDetails } = await import('./userService');

      await updateSanityUserWithAuthDetails('user123', { role: 'admin' });

      expect(mockPatchBuilder.set).toHaveBeenCalledWith({ role: 'admin' });
      expect(mockPatchBuilder.commit).toHaveBeenCalled();
    });

    it('updates user avatar', async () => {
      const { updateSanityUserWithAuthDetails } = await import('./userService');

      await updateSanityUserWithAuthDetails('user123', { avatar: 'avatar456' });

      expect(mockPatchBuilder.set).toHaveBeenCalledWith({
        avatar: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: 'avatar456',
          },
        },
      });
      expect(mockPatchBuilder.commit).toHaveBeenCalled();
    });

    it('updates multiple fields at once', async () => {
      const { updateSanityUserWithAuthDetails } = await import('./userService');

      await updateSanityUserWithAuthDetails('user123', {
        name: 'New Name',
        role: 'moderator',
        avatar: 'avatar789',
      });

      expect(mockPatchBuilder.set).toHaveBeenCalledTimes(3);
      expect(mockPatchBuilder.commit).toHaveBeenCalled();
    });

    it('handles update errors and returns null', async () => {
      mockPatchBuilder.commit.mockRejectedValue(new Error('Update failed'));

      const { updateSanityUserWithAuthDetails } = await import('./userService');
      const result = await updateSanityUserWithAuthDetails('user123', { name: 'Test' });

      expect(result).toBeNull();
      expect(mockStructuredLogger.error).toHaveBeenCalledWith(
        'Error updating Sanity user',
        expect.any(Error),
        expect.objectContaining({
          userId: 'user123',
          component: 'user-service',
          operation: 'update_user',
        })
      );
    });
  });

  describe('createLocalUser', () => {
    it('throws error if user already exists', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
          insertOne: jest.fn(),
        }),
      };

      const { createLocalUser } = await import('./userService');

      await expect(
        createLocalUser(mockDb, {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('User already exists');
    });

    it('normalizes email to lowercase before checking and saving', async () => {
      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'abc123' }),
      };
      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      mockBcryptHash.mockResolvedValue('hashed_password');
      mockSanityClient.fetch.mockResolvedValue(null);
      mockSanityClient.create.mockResolvedValue({ _id: 'user123' });

      const { createLocalUser } = await import('./userService');
      await createLocalUser(mockDb, {
        name: 'Test User',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
      });

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    it('hashes password before storing', async () => {
      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'abc123' }),
      };
      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      mockBcryptHash.mockResolvedValue('hashed_password');
      mockSanityClient.fetch.mockResolvedValue(null);
      mockSanityClient.create.mockResolvedValue({ _id: 'user123' });

      const { createLocalUser } = await import('./userService');
      await createLocalUser(mockDb, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 12);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed_password',
        })
      );
    });

    it('creates user in both MongoDB and Sanity', async () => {
      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'abc123' }),
      };
      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      mockBcryptHash.mockResolvedValue('hashed_password');
      mockSanityClient.fetch.mockResolvedValue(null);
      mockSanityClient.create.mockResolvedValue({ _id: 'user123' });

      const { createLocalUser } = await import('./userService');
      const result = await createLocalUser(mockDb, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed_password',
          role: 'user',
          createdAt: expect.any(Date),
        })
      );

      expect(mockSanityClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        })
      );

      expect(result).toEqual({ insertedId: 'abc123' });
    });
  });

  describe('updateUserRole', () => {
    it('returns null when userId is not provided', async () => {
      const { updateUserRole } = await import('./userService');

      const result = await updateUserRole('', 'admin');
      expect(result).toBeNull();
      expect(mockSanityClient.patch).not.toHaveBeenCalled();
    });

    it('returns null when newRole is not provided', async () => {
      const { updateUserRole } = await import('./userService');

      const result = await updateUserRole('user123', '');
      expect(result).toBeNull();
      expect(mockSanityClient.patch).not.toHaveBeenCalled();
    });

    it('updates user role in Sanity', async () => {
      const { updateUserRole } = await import('./userService');

      const result = await updateUserRole('user123', 'admin');

      expect(mockSanityClient.patch).toHaveBeenCalledWith('user123');
      expect(mockPatchBuilder.set).toHaveBeenCalledWith({ role: 'admin' });
      expect(mockPatchBuilder.commit).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('handles update errors and returns null', async () => {
      mockPatchBuilder.commit.mockRejectedValue(new Error('Update failed'));

      const { updateUserRole } = await import('./userService');
      const result = await updateUserRole('user123', 'admin');

      expect(result).toBeNull();
      expect(mockStructuredLogger.error).toHaveBeenCalledWith(
        'Error updating user role',
        expect.any(Error),
        expect.objectContaining({
          userId: 'user123',
          newRole: 'admin',
          component: 'user-service',
          operation: 'update_role',
        })
      );
    });
  });
});
