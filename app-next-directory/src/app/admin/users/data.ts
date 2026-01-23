export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'editor' | 'venueOwner';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin?: string;
  listingsCount: number;
  reviewsCount: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  suspendedUsers: number;
}

/**
 * Generates mock user data for testing and development
 */
export function generateMockUsers(count: number = 10): User[] {
  const roles: User['role'][] = ['admin', 'user', 'editor', 'venueOwner'];
  const statuses: User['status'][] = ['active', 'suspended', 'pending'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: roles[i % roles.length],
    status: statuses[i % statuses.length],
    createdAt: new Date(2024, 0, i + 1).toISOString(),
    lastLogin: i % 3 === 0 ? undefined : new Date(2024, 11, i + 1).toISOString(),
    listingsCount: Math.floor(Math.random() * 10),
    reviewsCount: Math.floor(Math.random() * 20),
  }));
}

/**
 * Generates mock user statistics
 */
export function generateMockStats(): UserStats {
  return {
    totalUsers: 245,
    activeUsers: 189,
    newUsers: 12,
    suspendedUsers: 3,
  };
}

/**
 * Filters users based on search term
 */
export function filterUsersBySearch(users: User[], searchTerm: string): User[] {
  if (!searchTerm.trim()) {
    return users;
  }
  
  const lowerSearch = searchTerm.toLowerCase();
  return users.filter(
    user =>
      user.name.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Filters users by role
 */
export function filterUsersByRole(
  users: User[],
  role: User['role'] | 'all'
): User[] {
  if (role === 'all') {
    return users;
  }
  return users.filter(user => user.role === role);
}

/**
 * Filters users by status
 */
export function filterUsersByStatus(
  users: User[],
  status: User['status'] | 'all'
): User[] {
  if (status === 'all') {
    return users;
  }
  return users.filter(user => user.status === status);
}

/**
 * Applies all filters to users list
 */
export function applyFilters(
  users: User[],
  filters: {
    searchTerm?: string;
    role?: User['role'] | 'all';
    status?: User['status'] | 'all';
  }
): User[] {
  let filtered = users;
  
  if (filters.searchTerm) {
    filtered = filterUsersBySearch(filtered, filters.searchTerm);
  }
  
  if (filters.role) {
    filtered = filterUsersByRole(filtered, filters.role);
  }
  
  if (filters.status) {
    filtered = filterUsersByStatus(filtered, filters.status);
  }
  
  return filtered;
}

/**
 * Validates user data
 */
export function validateUserData(user: Partial<User>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!user.name || user.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!user.email || user.email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Invalid email format');
  }
  
  if (!user.role) {
    errors.push('Role is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formats user creation date
 */
export function formatUserDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Gets user display name (handles missing names)
 */
export function getUserDisplayName(user: User): string {
  return user.name || user.email.split('@')[0] || 'Unknown User';
}

/**
 * Sorts users by various criteria
 */
export function sortUsers(
  users: User[],
  sortBy: 'name' | 'email' | 'createdAt' | 'role' | 'status' = 'name',
  order: 'asc' | 'desc' = 'asc'
): User[] {
  const sorted = [...users].sort((a, b) => {
    let aVal: string | number = a[sortBy];
    let bVal: string | number = b[sortBy];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}
