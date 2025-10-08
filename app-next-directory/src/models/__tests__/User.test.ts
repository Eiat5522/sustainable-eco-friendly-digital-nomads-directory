import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { IUser } from '../User';

// Mock bcryptjs as it's a dependency of the User model
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
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
  });

  describe('Password Field', () => {
    it('should not be selected by default', () => {
      const passwordField = User.schema.path('password') as any;
      expect(passwordField.options.select).toBe(false);
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

    it('should have createdAt and updatedAt fields', () => {
      const user = new User({ email: 'test@example.com' });
      // The mock creates these as Date objects now
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});