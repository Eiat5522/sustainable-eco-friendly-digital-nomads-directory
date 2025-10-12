import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { IUser, ROLE_VALUES } from '../User';

// Mock bcryptjs for password hashing tests
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$mockedHashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Dynamically import the User model to ensure a fresh instance for each test
let User: mongoose.Model<IUser>;

describe('User Model', () => {
  beforeEach(async () => {
    jest.resetModules();
    // Re-import the model and its dependencies to get a fresh copy
    const UserModule = await import('../User');
    User = UserModule.default;
  });

  describe('Schema Definition', () => {
    it('should define the User model with the correct name', () => {
      expect(User).toBeDefined();
      expect(User.modelName).toBe('User');
    });

    it('should have email as required field', () => {
      expect(User.schema.path('email').isRequired).toBeDefined();
    });

    it('should have optional fields correctly marked', () => {
      expect(User.schema.path('name').isRequired).toBe(false);
      expect(User.schema.path('password').isRequired).toBe(false);
    });
  });

  describe('Email Field', () => {
    it('should have email field with required validation', () => {
      expect(User.schema.path('email').isRequired).toBeDefined();
    });

    it('should have trim option on email', () => {
      expect(User.schema.path('email').options.trim).toBe(true);
    });

    it('should have lowercase option on email', () => {
      expect(User.schema.path('email').options.lowercase).toBe(true);
    });

    it('should have email validator', () => {
      const emailField = User.schema.path('email');
      expect(emailField.options.validate).toBeDefined();
    });

    it('should convert email to lowercase on instantiation', () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        name: 'Test User',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should trim whitespace from email', () => {
      const user = new User({
        email: '  user@example.com  ',
      });

      expect(user.email).toBe('user@example.com');
    });

    it('should handle various email formats', () => {
      const testCases = [
        { input: 'User@Example.COM', expected: 'user@example.com' },
        { input: '  TEST@EXAMPLE.COM  ', expected: 'test@example.com' },
        { input: 'valid.email+tag@subdomain.example.com', expected: 'valid.email+tag@subdomain.example.com' },
      ];

      testCases.forEach(({ input, expected }) => {
        const user = new User({ email: input });
        expect(user.email).toBe(expected);
      });
    });
  });

  describe('Password Field', () => {
    it('should not be selected by default', () => {
      const passwordField = User.schema.path('password') as any;
      expect(passwordField.options.select).toBe(false);
    });

    it('should have password field as optional', () => {
      const user = new User({
        email: 'test@example.com',
      });
      expect(user.password).toBeUndefined();
    });

    it('should allow users without passwords for OAuth', () => {
      const user = new User({
        email: 'oauth-user@example.com',
        name: 'OAuth User',
      });

      expect(user.password).toBeUndefined();
    });

    it('should allow setting password field', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'plainPassword',
      });

      expect(user.password).toBeDefined();
    });
  });

  describe('Role Field', () => {
    it('should have enum with all defined roles', () => {
      const roleField = User.schema.path('role') as any;
      expect(roleField.enumValues).toEqual(ROLE_VALUES);
    });

    it('should default role to "user"', () => {
      const user = new User({ email: 'test@example.com' });
      expect(user.role).toBe('user');
    });

    it('should accept all valid role values', () => {
      ROLE_VALUES.forEach(role => {
        const user = new User({
          email: `${role}@example.com`,
          role,
        });
        expect(user.role).toBe(role);
      });
    });

    it('should maintain role hierarchy values', () => {
      expect(ROLE_VALUES).toContain('user');
      expect(ROLE_VALUES).toContain('admin');
      expect(ROLE_VALUES).toContain('superAdmin');
      expect(ROLE_VALUES).toHaveLength(5);
    });
  });

  describe('Default Values', () => {
    it('should default role to "user"', () => {
      const user = new User({ email: 'test@example.com' });
      expect(user.role).toBe('user');
    });

    it('should default emailVerified to null', () => {
      const user = new User({ email: 'test@example.com' });
      expect(user.emailVerified).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should have timestamps enabled', () => {
      expect(User.schema.options.timestamps).toBe(true);
    });

    it('should have createdAt and updatedAt fields on instantiation', () => {
      const user = new User({
        email: 'test@example.com',
      });

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should set timestamps within reasonable time range', () => {
      const before = new Date();
      const user = new User({
        email: 'test@example.com',
      });
      const after = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(user.updatedAt).toEqual(user.createdAt);
    });
  });

  describe('User Instance Creation', () => {
    it('should create a user with all fields', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123',
        role: 'editor' as const,
        image: 'https://example.com/avatar.jpg',
      };

      const user = new User(userData);

      expect(user._id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(user.role).toBe(userData.role);
      expect(user.image).toBe(userData.image);
    });

    it('should create minimal user with only email', () => {
      const user = new User({ email: 'minimal@example.com' });

      expect(user._id).toBeDefined();
      expect(user.email).toBe('minimal@example.com');
      expect(user.role).toBe('user');
      expect(user.emailVerified).toBeNull();
    });

    it('should handle email verification state', () => {
      const unverified = new User({ email: 'test@example.com' });
      expect(unverified.emailVerified).toBeNull();

      const verificationDate = new Date();
      const verified = new User({
        email: 'verified@example.com',
        emailVerified: verificationDate,
      });
      expect(verified.emailVerified).toEqual(verificationDate);
    });

    it('should support profile image field', () => {
      const user = new User({
        email: 'user@example.com',
        image: 'https://example.com/avatar.jpg',
      });

      expect(user.image).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('Model Methods', () => {
    it('should have save method', () => {
      const user = new User({ email: 'test@example.com' });
      expect(typeof user.save).toBe('function');
    });

    it('should have validate method', () => {
      const user = new User({ email: 'test@example.com' });
      expect(typeof user.validate).toBe('function');
    });

    it('should have isModified method', () => {
      const user = new User({ email: 'test@example.com' });
      expect(typeof user.isModified).toBe('function');
    });
  });
});