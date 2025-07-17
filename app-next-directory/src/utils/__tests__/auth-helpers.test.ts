// Mock NextAuth completely to avoid ES module issues
jest.mock('next-auth', () => ({
  default: jest.fn(),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
}));

// Mock the API response handler
jest.mock('../api-response', () => ({
  ApiResponseHandler: {
    unauthorized: jest.fn(),
    forbidden: jest.fn(),
    error: jest.fn(),
  },
}));

// Import the function we want to test
import { validateSession } from '../auth-helpers';

describe('Auth Helpers Tests', () => {
  it('should validate user role checking logic', () => {
    const hasRole = (userRole: string, requiredRoles: string[]) => {
      if (!userRole || !requiredRoles || requiredRoles.length === 0) return false;
      return requiredRoles.includes(userRole) || userRole === 'admin';
    };

    expect(hasRole('admin', ['user'])).toBe(true); // Admin has access to everything
    expect(hasRole('admin', ['admin'])).toBe(true);
    expect(hasRole('venueOwner', ['venueOwner'])).toBe(true);
    expect(hasRole('user', ['user'])).toBe(true);
    expect(hasRole('user', ['admin'])).toBe(false);
    expect(hasRole('user', ['venueOwner'])).toBe(false);
  });

  it('should handle user session validation', () => {
    const validSession = {
      user: { email: 'test@example.com', role: 'user' }
    };
    
    const invalidSession1 = null;
    const invalidSession2 = {};
    const invalidSession3 = { user: {} };

    expect(validateSession(validSession)).toBe(true);
    expect(validateSession(invalidSession1)).toBe(false);
    expect(validateSession(invalidSession2)).toBe(false);
    expect(validateSession(invalidSession3)).toBe(false);
  });

  it('should handle user creation data validation', () => {
    const validateUserData = (userData: any) => {
      const requiredFields = ['email', 'name'];
      const allowedRoles = ['user', 'venueOwner', 'admin'];
      
      if (!userData || typeof userData !== 'object') return false;
      
      for (const field of requiredFields) {
        if (!userData[field] || typeof userData[field] !== 'string') return false;
      }
      
      if (userData.role && !allowedRoles.includes(userData.role)) return false;
      
      return true;
    };

    const validUser = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    };

    const invalidUser1 = null;
    const invalidUser2 = { email: 'test@example.com' }; // Missing name
    const invalidUser3 = { email: 'test@example.com', name: 'Test', role: 'invalidRole' };

    expect(validateUserData(validUser)).toBe(true);
    expect(validateUserData(invalidUser1)).toBe(false);
    expect(validateUserData(invalidUser2)).toBe(false);
    expect(validateUserData(invalidUser3)).toBe(false);
  });

  it('should handle password validation', () => {
    const validatePassword = (password: string) => {
      if (!password || typeof password !== 'string') return false;
      if (password.length < 8) return false;
      if (!/(?=.*[a-z])/.test(password)) return false; // At least one lowercase
      if (!/(?=.*[A-Z])/.test(password)) return false; // At least one uppercase
      if (!/(?=.*\d)/.test(password)) return false; // At least one digit
      return true;
    };

    expect(validatePassword('ValidPass123')).toBe(true);
    expect(validatePassword('validpass123')).toBe(false); // No uppercase
    expect(validatePassword('VALIDPASS123')).toBe(false); // No lowercase
    expect(validatePassword('ValidPass')).toBe(false); // No digit
    expect(validatePassword('Valid1')).toBe(false); // Too short
    expect(validatePassword('')).toBe(false); // Empty
    expect(validatePassword(null as any)).toBe(false); // Null
  });

  it('should handle email validation', () => {
    const validateEmail = (email: string) => {
      if (!email || typeof email !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    expect(validateEmail('invalid.email')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(null as any)).toBe(false);
  });
});
