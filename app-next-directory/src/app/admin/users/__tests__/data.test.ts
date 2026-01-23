import {
  generateMockUsers,
  generateMockStats,
  filterUsersBySearch,
  filterUsersByRole,
  filterUsersByStatus,
  applyFilters,
  validateUserData,
  formatUserDate,
  getUserDisplayName,
  sortUsers,
  type User,
} from '../data';

describe('data.ts - User Management Utilities', () => {
  describe('generateMockUsers', () => {
    it('should generate the specified number of users', () => {
      const users = generateMockUsers(5);
      expect(users).toHaveLength(5);
    });

    it('should generate 10 users by default', () => {
      const users = generateMockUsers();
      expect(users).toHaveLength(10);
    });

    it('should generate users with all required fields', () => {
      const users = generateMockUsers(1);
      const user = users[0];
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('listingsCount');
      expect(user).toHaveProperty('reviewsCount');
    });

    it('should generate users with valid roles', () => {
      const users = generateMockUsers(10);
      const validRoles = ['admin', 'user', 'editor', 'venueOwner'];
      
      users.forEach(user => {
        expect(validRoles).toContain(user.role);
      });
    });

    it('should generate users with valid statuses', () => {
      const users = generateMockUsers(10);
      const validStatuses = ['active', 'suspended', 'pending'];
      
      users.forEach(user => {
        expect(validStatuses).toContain(user.status);
      });
    });

    it('should generate unique user IDs', () => {
      const users = generateMockUsers(10);
      const ids = users.map(u => u.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate valid ISO date strings', () => {
      const users = generateMockUsers(5);
      users.forEach(user => {
        expect(() => new Date(user.createdAt)).not.toThrow();
        expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);
      });
    });
  });

  describe('generateMockStats', () => {
    it('should return stats with all required fields', () => {
      const stats = generateMockStats();
      
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeUsers');
      expect(stats).toHaveProperty('newUsers');
      expect(stats).toHaveProperty('suspendedUsers');
    });

    it('should return numeric values', () => {
      const stats = generateMockStats();
      
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.activeUsers).toBe('number');
      expect(typeof stats.newUsers).toBe('number');
      expect(typeof stats.suspendedUsers).toBe('number');
    });

    it('should return consistent stats', () => {
      const stats1 = generateMockStats();
      const stats2 = generateMockStats();
      
      expect(stats1).toEqual(stats2);
    });
  });

  describe('filterUsersBySearch', () => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        listingsCount: 1,
        reviewsCount: 2,
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-02T00:00:00Z',
        listingsCount: 3,
        reviewsCount: 4,
      },
    ];

    it('should return all users when search term is empty', () => {
      const result = filterUsersBySearch(mockUsers, '');
      expect(result).toEqual(mockUsers);
    });

    it('should return all users when search term is whitespace', () => {
      const result = filterUsersBySearch(mockUsers, '   ');
      expect(result).toEqual(mockUsers);
    });

    it('should filter users by name (case-insensitive)', () => {
      const result = filterUsersBySearch(mockUsers, 'john');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should filter users by email (case-insensitive)', () => {
      const result = filterUsersBySearch(mockUsers, 'JANE@');
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('jane@example.com');
    });

    it('should handle partial matches', () => {
      const result = filterUsersBySearch(mockUsers, 'example');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no matches found', () => {
      const result = filterUsersBySearch(mockUsers, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterUsersByRole', () => {
    const mockUsers: User[] = [
      { id: '1', name: 'User 1', email: 'u1@ex.com', role: 'user', status: 'active', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
      { id: '2', name: 'User 2', email: 'u2@ex.com', role: 'admin', status: 'active', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
      { id: '3', name: 'User 3', email: 'u3@ex.com', role: 'user', status: 'active', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
    ];

    it('should return all users when role is "all"', () => {
      const result = filterUsersByRole(mockUsers, 'all');
      expect(result).toEqual(mockUsers);
    });

    it('should filter users by specific role', () => {
      const result = filterUsersByRole(mockUsers, 'user');
      expect(result).toHaveLength(2);
      result.forEach(user => expect(user.role).toBe('user'));
    });

    it('should filter admin users', () => {
      const result = filterUsersByRole(mockUsers, 'admin');
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('admin');
    });
  });

  describe('filterUsersByStatus', () => {
    const mockUsers: User[] = [
      { id: '1', name: 'User 1', email: 'u1@ex.com', role: 'user', status: 'active', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
      { id: '2', name: 'User 2', email: 'u2@ex.com', role: 'user', status: 'suspended', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
      { id: '3', name: 'User 3', email: 'u3@ex.com', role: 'user', status: 'active', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
    ];

    it('should return all users when status is "all"', () => {
      const result = filterUsersByStatus(mockUsers, 'all');
      expect(result).toEqual(mockUsers);
    });

    it('should filter users by specific status', () => {
      const result = filterUsersByStatus(mockUsers, 'active');
      expect(result).toHaveLength(2);
      result.forEach(user => expect(user.status).toBe('active'));
    });

    it('should filter suspended users', () => {
      const result = filterUsersByStatus(mockUsers, 'suspended');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('suspended');
    });
  });

  describe('applyFilters', () => {
    const mockUsers: User[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', status: 'suspended', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user', status: 'active', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
    ];

    it('should apply search filter', () => {
      const result = applyFilters(mockUsers, { searchTerm: 'john' });
      expect(result).toHaveLength(2);
    });

    it('should apply role filter', () => {
      const result = applyFilters(mockUsers, { role: 'user' });
      expect(result).toHaveLength(2);
    });

    it('should apply status filter', () => {
      const result = applyFilters(mockUsers, { status: 'active' });
      expect(result).toHaveLength(2);
    });

    it('should apply multiple filters', () => {
      const result = applyFilters(mockUsers, {
        searchTerm: 'john doe',
        role: 'user',
        status: 'active',
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should return all users when no filters provided', () => {
      const result = applyFilters(mockUsers, {});
      expect(result).toEqual(mockUsers);
    });
  });

  describe('validateUserData', () => {
    it('should validate complete valid user data', () => {
      const user = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user' as const,
      };
      const result = validateUserData(user);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const user = {
        name: '',
        email: 'john@example.com',
        role: 'user' as const,
      };
      const result = validateUserData(user);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should reject whitespace-only name', () => {
      const user = {
        name: '   ',
        email: 'john@example.com',
        role: 'user' as const,
      };
      const result = validateUserData(user);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should reject empty email', () => {
      const user = {
        name: 'John Doe',
        email: '',
        role: 'user' as const,
      };
      const result = validateUserData(user);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject invalid email format', () => {
      const user = {
        name: 'John Doe',
        email: 'invalid-email',
        role: 'user' as const,
      };
      const result = validateUserData(user);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should reject missing role', () => {
      const user = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      const result = validateUserData(user);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Role is required');
    });

    it('should return multiple errors', () => {
      const user = {
        name: '',
        email: 'invalid',
      };
      const result = validateUserData(user);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('formatUserDate', () => {
    it('should format valid date string', () => {
      const date = '2024-01-15T10:30:00Z';
      const result = formatUserDate(date);
      expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/2024/);
    });

    it('should handle invalid date string', () => {
      const result = formatUserDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });

    it('should format different date correctly', () => {
      const date = '2024-12-25T00:00:00Z';
      const result = formatUserDate(date);
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2024');
    });
  });

  describe('getUserDisplayName', () => {
    it('should return user name when available', () => {
      const user: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        listingsCount: 0,
        reviewsCount: 0,
      };
      expect(getUserDisplayName(user)).toBe('John Doe');
    });

    it('should extract name from email when name is empty', () => {
      const user: User = {
        id: '1',
        name: '',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        listingsCount: 0,
        reviewsCount: 0,
      };
      expect(getUserDisplayName(user)).toBe('john');
    });

    it('should return "Unknown User" as fallback', () => {
      const user: User = {
        id: '1',
        name: '',
        email: '',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        listingsCount: 0,
        reviewsCount: 0,
      };
      expect(getUserDisplayName(user)).toBe('Unknown User');
    });
  });

  describe('sortUsers', () => {
    const mockUsers: User[] = [
      { id: '1', name: 'Charlie', email: 'c@ex.com', role: 'user', status: 'active', createdAt: '2024-01-03T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
      { id: '2', name: 'Alice', email: 'a@ex.com', role: 'admin', status: 'pending', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
      { id: '3', name: 'Bob', email: 'b@ex.com', role: 'editor', status: 'suspended', createdAt: '2024-01-02T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
    ];

    it('should sort by name ascending by default', () => {
      const result = sortUsers(mockUsers);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should sort by name descending', () => {
      const result = sortUsers(mockUsers, 'name', 'desc');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });

    it('should sort by email', () => {
      const result = sortUsers(mockUsers, 'email', 'asc');
      expect(result[0].email).toBe('a@ex.com');
      expect(result[1].email).toBe('b@ex.com');
      expect(result[2].email).toBe('c@ex.com');
    });

    it('should sort by createdAt', () => {
      const result = sortUsers(mockUsers, 'createdAt', 'asc');
      expect(result[0].createdAt).toBe('2024-01-01T00:00:00Z');
      expect(result[1].createdAt).toBe('2024-01-02T00:00:00Z');
      expect(result[2].createdAt).toBe('2024-01-03T00:00:00Z');
    });

    it('should not mutate original array', () => {
      const original = [...mockUsers];
      sortUsers(mockUsers);
      expect(mockUsers).toEqual(original);
    });

    it('should handle case-insensitive sorting', () => {
      const users: User[] = [
        { id: '1', name: 'alice', email: 'a@ex.com', role: 'user', status: 'active', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
        { id: '2', name: 'ALICE', email: 'b@ex.com', role: 'user', status: 'active', createdAt: '2024-01-01T00:00:00Z', listingsCount: 0, reviewsCount: 0 },
      ];
      const result = sortUsers(users, 'name');
      expect(result).toHaveLength(2);
    });
  });
});
