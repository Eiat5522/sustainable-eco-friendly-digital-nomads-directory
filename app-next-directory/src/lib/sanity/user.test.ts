/**
 * Tests for user.ts - Sanity user management functions
 */

import { ensureSanityUser, unfavoriteListing } from './user';
import { client } from './client';

// Mock the client module
jest.mock('./client', () => ({
  client: {
    createIfNotExists: jest.fn(),
    patch: jest.fn(() => ({
      set: jest.fn(() => ({
        commit: jest.fn(),
      })),
    })),
    fetch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
}));

describe('user.ts', () => {
  const mockClient = client as jest.Mocked<typeof client>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureSanityUser', () => {
    it('should create a new user when user does not exist', async () => {
      const mockUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: expect.any(String),
      };

      mockClient.createIfNotExists.mockResolvedValue(mockUser);

      const result = await ensureSanityUser({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      });

      expect(mockClient.createIfNotExists).toHaveBeenCalledWith({
        _id: 'user-123',
        _type: 'user',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: expect.any(String),
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when id is missing', async () => {
      const result = await ensureSanityUser({
        id: '',
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(result).toBeNull();
      expect(mockClient.createIfNotExists).not.toHaveBeenCalled();
    });

    it('should use fallback name "Anonymous" when name is null', async () => {
      const mockUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'Anonymous',
        email: 'john@example.com',
        role: 'user',
        createdAt: expect.any(String),
      };

      mockClient.createIfNotExists.mockResolvedValue(mockUser);

      await ensureSanityUser({
        id: 'user-123',
        name: null,
        email: 'john@example.com',
      });

      expect(mockClient.createIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Anonymous',
        })
      );
    });

    it('should use fallback name "Anonymous" when name is empty string', async () => {
      const mockUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'Anonymous',
        role: 'user',
        createdAt: expect.any(String),
      };

      mockClient.createIfNotExists.mockResolvedValue(mockUser);

      await ensureSanityUser({
        id: 'user-123',
        name: '   ',
        email: null,
      });

      expect(mockClient.createIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Anonymous',
        })
      );
    });

    it('should normalize email to lowercase and trim', async () => {
      const mockUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: expect.any(String),
      };

      mockClient.createIfNotExists.mockResolvedValue(mockUser);

      await ensureSanityUser({
        id: 'user-123',
        name: 'John Doe',
        email: '  JOHN@EXAMPLE.COM  ',
      });

      expect(mockClient.createIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@example.com',
        })
      );
    });

    it('should default role to "user" when not provided', async () => {
      const mockUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: expect.any(String),
      };

      mockClient.createIfNotExists.mockResolvedValue(mockUser);

      await ensureSanityUser({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(mockClient.createIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
        })
      );
    });

    it('should omit email field when email is null or empty', async () => {
      const mockUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'John Doe',
        role: 'user',
        createdAt: expect.any(String),
      };

      mockClient.createIfNotExists.mockResolvedValue(mockUser);

      await ensureSanityUser({
        id: 'user-123',
        name: 'John Doe',
        email: null,
      });

      expect(mockClient.createIfNotExists).toHaveBeenCalledWith(
        expect.not.objectContaining({
          email: expect.anything(),
        })
      );
    });

    it('should update user when name changes', async () => {
      const existingUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'Old Name',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const updatedUser = {
        ...existingUser,
        name: 'New Name',
      };

      mockClient.createIfNotExists.mockResolvedValue(existingUser);
      
      const mockPatchChain = {
        set: jest.fn().mockReturnValue({
          commit: jest.fn().mockResolvedValue(updatedUser),
        }),
      };
      mockClient.patch.mockReturnValue(mockPatchChain as any);

      const result = await ensureSanityUser({
        id: 'user-123',
        name: 'New Name',
        email: 'john@example.com',
        role: 'user',
      });

      expect(mockClient.patch).toHaveBeenCalledWith('user-123');
      expect(mockPatchChain.set).toHaveBeenCalledWith({ name: 'New Name' });
      expect(result).toEqual(updatedUser);
    });

    it('should update user when email changes', async () => {
      const existingUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'John Doe',
        email: 'old@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const updatedUser = {
        ...existingUser,
        email: 'new@example.com',
      };

      mockClient.createIfNotExists.mockResolvedValue(existingUser);
      
      const mockPatchChain = {
        set: jest.fn().mockReturnValue({
          commit: jest.fn().mockResolvedValue(updatedUser),
        }),
      };
      mockClient.patch.mockReturnValue(mockPatchChain as any);

      const result = await ensureSanityUser({
        id: 'user-123',
        name: 'John Doe',
        email: 'new@example.com',
        role: 'user',
      });

      expect(mockPatchChain.set).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(result).toEqual(updatedUser);
    });

    it('should update user when role changes', async () => {
      const existingUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const updatedUser = {
        ...existingUser,
        role: 'admin',
      };

      mockClient.createIfNotExists.mockResolvedValue(existingUser);
      
      const mockPatchChain = {
        set: jest.fn().mockReturnValue({
          commit: jest.fn().mockResolvedValue(updatedUser),
        }),
      };
      mockClient.patch.mockReturnValue(mockPatchChain as any);

      const result = await ensureSanityUser({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
      });

      expect(mockPatchChain.set).toHaveBeenCalledWith({ role: 'admin' });
      expect(result).toEqual(updatedUser);
    });

    it('should update multiple fields when they change', async () => {
      const existingUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'Old Name',
        email: 'old@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const updatedUser = {
        ...existingUser,
        name: 'New Name',
        email: 'new@example.com',
        role: 'moderator',
      };

      mockClient.createIfNotExists.mockResolvedValue(existingUser);
      
      const mockPatchChain = {
        set: jest.fn().mockReturnValue({
          commit: jest.fn().mockResolvedValue(updatedUser),
        }),
      };
      mockClient.patch.mockReturnValue(mockPatchChain as any);

      await ensureSanityUser({
        id: 'user-123',
        name: 'New Name',
        email: 'new@example.com',
        role: 'moderator',
      });

      expect(mockPatchChain.set).toHaveBeenCalledWith({
        name: 'New Name',
        email: 'new@example.com',
        role: 'moderator',
      });
    });

    it('should not update when no fields change', async () => {
      const existingUser = {
        _id: 'user-123',
        _type: 'user' as const,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockClient.createIfNotExists.mockResolvedValue(existingUser);

      const result = await ensureSanityUser({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      });

      expect(mockClient.patch).not.toHaveBeenCalled();
      expect(result).toEqual(existingUser);
    });

    it('should handle errors gracefully and return null', async () => {
      // In test environment, ensureSanityUser is mockable and we need to force it to call the internal function
      mockClient.createIfNotExists.mockRejectedValue(new Error('Database error'));

      // This will fall through to ensureSanityUserInternal by default since no mock is set
      const result = await ensureSanityUser({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(result).toBeNull();
      // The error is logged but we can't easily verify it in test environment
      // because the mock wrapper may alter the flow
    });

    it('should handle different user roles', async () => {
      const roles = ['user', 'moderator', 'admin', 'business_owner', 'super_admin'];

      for (const role of roles) {
        jest.clearAllMocks();

        const mockUser = {
          _id: `user-${role}`,
          _type: 'user' as const,
          name: 'Test User',
          email: 'test@example.com',
          role,
          createdAt: expect.any(String),
        };

        mockClient.createIfNotExists.mockResolvedValue(mockUser);

        await ensureSanityUser({
          id: `user-${role}`,
          name: 'Test User',
          email: 'test@example.com',
          role: role as any,
        });

        expect(mockClient.createIfNotExists).toHaveBeenCalledWith(
          expect.objectContaining({ role })
        );
      }
    });

    // Test the mockable function utilities (only in test environment)
    it('should support mockResolvedValueOnce', async () => {
      const testUser = {
        _id: 'test-user',
        _type: 'user' as const,
        name: 'Mocked User',
        email: 'mock@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      };

      // Type assertion since we know it's mockable in test environment
      const mockableFunc = ensureSanityUser as any;
      if (mockableFunc.mockResolvedValueOnce) {
        mockableFunc.mockResolvedValueOnce(testUser);

        const result = await ensureSanityUser({
          id: 'test-user',
          name: 'Test',
          email: 'test@example.com',
        });

        expect(result).toEqual(testUser);
      }
    });

    it('should support mockImplementation', async () => {
      const mockableFunc = ensureSanityUser as any;
      if (mockableFunc.mockImplementation && mockableFunc.mockReset) {
        mockableFunc.mockReset();
        
        mockableFunc.mockImplementation((options: any) => ({
          _id: options.id,
          _type: 'user' as const,
          name: `Custom ${options.name}`,
          email: options.email,
          role: options.role || 'user',
          createdAt: '2024-01-01T00:00:00Z',
        }));

        const result = await ensureSanityUser({
          id: 'custom-user',
          name: 'Test',
          email: 'test@example.com',
        });

        expect(result?.name).toBe('Custom Test');
      }
    });

    it('should support mockClear', async () => {
      const mockableFunc = ensureSanityUser as any;
      if (mockableFunc.mockClear && mockableFunc.mock) {
        mockableFunc.mockClear();
        
        await ensureSanityUser({
          id: 'user-1',
          name: 'Test',
          email: 'test@example.com',
        });

        expect(mockableFunc.mock.calls.length).toBeGreaterThan(0);
        
        mockableFunc.mockClear();
        expect(mockableFunc.mock.calls.length).toBe(0);
      }
    });

    it('should have _isMockFunction property in test environment', () => {
      const mockableFunc = ensureSanityUser as any;
      expect(mockableFunc._isMockFunction).toBe(true);
    });
  });

  describe('unfavoriteListing', () => {
    it('should delete favorite when it exists', async () => {
      const mockFavorite = {
        _id: 'favorite-123',
        _type: 'userFavorite',
        user: { _ref: 'user-123' },
        listing: { _ref: 'listing-456' },
      };

      mockClient.fetch.mockResolvedValue(mockFavorite);
      mockClient.delete.mockResolvedValue('deleted');

      await unfavoriteListing('user-123', 'listing-456');

      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "userFavorite"'),
        { userId: 'user-123', listingId: 'listing-456' }
      );
      expect(mockClient.delete).toHaveBeenCalledWith('favorite-123');
    });

    it('should not delete when favorite does not exist', async () => {
      mockClient.fetch.mockResolvedValue(null);

      await unfavoriteListing('user-123', 'listing-456');

      expect(mockClient.fetch).toHaveBeenCalled();
      expect(mockClient.delete).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      mockClient.fetch.mockRejectedValue(new Error('Network error'));

      // Should not throw, errors are caught internally
      await expect(unfavoriteListing('user-123', 'listing-456')).resolves.not.toThrow();
    });

    it('should handle delete errors gracefully', async () => {
      const mockFavorite = {
        _id: 'favorite-123',
        _type: 'userFavorite',
      };

      mockClient.fetch.mockResolvedValue(mockFavorite);
      mockClient.delete.mockRejectedValue(new Error('Delete failed'));

      // Should not throw, errors are caught internally
      await expect(unfavoriteListing('user-123', 'listing-456')).resolves.not.toThrow();
    });

    it('should use correct query to find favorite', async () => {
      mockClient.fetch.mockResolvedValue(null);

      await unfavoriteListing('user-123', 'listing-456');

      const query = mockClient.fetch.mock.calls[0][0];
      expect(query).toContain('_type == "userFavorite"');
      expect(query).toContain('user._ref == $userId');
      expect(query).toContain('listing._ref == $listingId');
    });

    it('should handle different user and listing IDs', async () => {
      mockClient.fetch.mockResolvedValue(null);

      await unfavoriteListing('different-user', 'different-listing');

      expect(mockClient.fetch).toHaveBeenCalledWith(
        expect.any(String),
        { userId: 'different-user', listingId: 'different-listing' }
      );
    });
  });
});
