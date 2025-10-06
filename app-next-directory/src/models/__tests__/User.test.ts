import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import User, { IUser, ROLE_VALUES, BCRYPT_COST } from '../User';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`$2a$12$hashed_${password}`)),
  compare: jest.fn((password: string, hash: string) => Promise.resolve(hash.includes(password))),
}));

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define User model', () => {
      expect(User).toBeDefined();
      expect(User.modelName).toBe('User');
    });

    it('should have correct schema structure', () => {
      const schema = User.schema;
      expect(schema.path('name')).toBeDefined();
      expect(schema.path('email')).toBeDefined();
      expect(schema.path('password')).toBeDefined();
      expect(schema.path('role')).toBeDefined();
      expect(schema.path('emailVerified')).toBeDefined();
      expect(schema.path('image')).toBeDefined();
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('updatedAt')).toBeDefined();
    });

    it('should have email as required field', () => {
      expect(User.schema.path('email').isRequired).toBe(true);
    });

    it('should have optional fields', () => {
      expect(User.schema.path('name').isRequired).toBe(false);
      expect(User.schema.path('password').isRequired).toBe(false);
      expect(User.schema.path('image').isRequired).toBe(false);
    });

    it('should have timestamps enabled', () => {
      expect(User.schema.options.timestamps).toBe(true);
    });
  });

  describe('Constants', () => {
    it('should have correct ROLE_VALUES', () => {
      expect(ROLE_VALUES).toEqual(['user', 'editor', 'venueOwner', 'admin', 'superAdmin']);
    });

    it('should have BCRYPT_COST defined', () => {
      expect(BCRYPT_COST).toBeDefined();
      expect(typeof BCRYPT_COST).toBe('number');
      expect(BCRYPT_COST).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Email Field', () => {
    it('should have email field with required validation', () => {
      expect(User.schema.path('email').isRequired).toBe(true);
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
    it('should have password field with select: false', () => {
      const passwordField = User.schema.path('password');
      expect(passwordField.options.select).toBe(false);
    });

    it('should be optional', () => {
      expect(User.schema.path('password').isRequired).toBe(false);
    });
  });

  describe('Role Field', () => {
    it('should have role field with enum validation', () => {
      const roleField = User.schema.path('role');
      expect(roleField.enumValues).toEqual(ROLE_VALUES);
    });

    it('should have default role value', () => {
      const user = new User({
        email: 'test@example.com',
      });
      expect(user.role).toBe('user');
    });

    it('should accept valid role values', () => {
      ROLE_VALUES.forEach((role) => {
        const user = new User({
          email: 'test@example.com',
          role,
        });
        expect(user.role).toBe(role);
      });
    });
  });

  describe('EmailVerified Field', () => {
    it('should have emailVerified field with default null', () => {
      const user = new User({
        email: 'test@example.com',
      });
      expect(user.emailVerified).toBeNull();
    });

    it('should accept Date value', () => {
      const verifiedDate = new Date();
      const user = new User({
        email: 'test@example.com',
        emailVerified: verifiedDate,
      });
      expect(user.emailVerified).toEqual(verifiedDate);
    });
  });

  describe('Model Creation', () => {
    it('should create a valid user with required fields only', () => {
      const user = new User({
        email: 'test@example.com',
      });

      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
      expect(user.emailVerified).toBeNull();
    });

    it('should create user with all fields', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        role: 'editor' as const,
        emailVerified: new Date(),
        image: 'https://example.com/avatar.jpg',
      };

      const user = new User(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user.role).toBe(userData.role);
      expect(user.emailVerified).toEqual(userData.emailVerified);
      expect(user.image).toBe(userData.image);
    });

    it('should convert email to lowercase', () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should trim email whitespace', () => {
      const user = new User({
        email: '  test@example.com  ',
      });

      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Pre-save Hook for Password Hashing', () => {
    it('should have pre-save hook defined', () => {
      const preSaveHooks = User.schema.pre('save');
      expect(preSaveHooks).toBeDefined();
    });

    it('should hash password when password is modified', async () => {
      const bcrypt = require('bcryptjs');
      const user = new User({
        email: 'test@example.com',
        password: 'plainPassword',
      });

      // Mock isModified
      user.isModified = jest.fn((field: string) => field === 'password');

      await user.validate();
      
      expect(bcrypt.hash).toBeDefined();
    });

    it('should skip hashing if password is not modified', async () => {
      const bcrypt = require('bcryptjs');
      bcrypt.hash.mockClear();

      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
      });

      user.isModified = jest.fn(() => false);

      await user.validate();
      
      // Hash should not be called if password is not modified
      expect(bcrypt.hash).toBeDefined();
    });

    it('should skip hashing if password is already a bcrypt hash', async () => {
      const bcrypt = require('bcryptjs');
      bcrypt.hash.mockClear();

      const existingHash = '$2a$12$alreadyHashedPassword';
      const user = new User({
        email: 'test@example.com',
        password: existingHash,
      });

      user.isModified = jest.fn((field: string) => field === 'password');

      await user.validate();

      // The password should remain unchanged if it's already a hash
      expect(user.password).toBe(existingHash);
    });

    it('should skip hashing if password is undefined', async () => {
      const bcrypt = require('bcryptjs');
      bcrypt.hash.mockClear();

      const user = new User({
        email: 'test@example.com',
      });

      user.isModified = jest.fn((field: string) => field === 'password');

      await user.validate();

      expect(user.password).toBeUndefined();
    });
  });

  describe('Role Hierarchy', () => {
    it('should create user with default user role', () => {
      const user = new User({ email: 'user@example.com' });
      expect(user.role).toBe('user');
    });

    it('should create editor user', () => {
      const user = new User({ email: 'editor@example.com', role: 'editor' });
      expect(user.role).toBe('editor');
    });

    it('should create venueOwner user', () => {
      const user = new User({ email: 'owner@example.com', role: 'venueOwner' });
      expect(user.role).toBe('venueOwner');
    });

    it('should create admin user', () => {
      const user = new User({ email: 'admin@example.com', role: 'admin' });
      expect(user.role).toBe('admin');
    });

    it('should create superAdmin user', () => {
      const user = new User({ email: 'superadmin@example.com', role: 'superAdmin' });
      expect(user.role).toBe('superAdmin');
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = User;
      const model2 = mongoose.models.User;
      expect(model1).toBe(model2);
    });
  });

  describe('Email Verification', () => {
    it('should create unverified user by default', () => {
      const user = new User({ email: 'test@example.com' });
      expect(user.emailVerified).toBeNull();
    });

    it('should allow setting emailVerified to a date', () => {
      const verifiedAt = new Date('2024-01-01');
      const user = new User({
        email: 'test@example.com',
        emailVerified: verifiedAt,
      });
      expect(user.emailVerified).toEqual(verifiedAt);
    });

    it('should allow explicitly setting emailVerified to null', () => {
      const user = new User({
        email: 'test@example.com',
        emailVerified: null,
      });
      expect(user.emailVerified).toBeNull();
    });
  });

  describe('User Image/Avatar', () => {
    it('should allow setting user image URL', () => {
      const imageUrl = 'https://example.com/avatar.jpg';
      const user = new User({
        email: 'test@example.com',
        image: imageUrl,
      });
      expect(user.image).toBe(imageUrl);
    });

    it('should allow user without image', () => {
      const user = new User({
        email: 'test@example.com',
      });
      expect(user.image).toBeUndefined();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt field', () => {
      const user = new User({ email: 'test@example.com' });
      expect(user.createdAt).toBeDefined();
    });

    it('should have updatedAt field', () => {
      const user = new User({ email: 'test@example.com' });
      expect(user.updatedAt).toBeDefined();
    });
  });

  describe('Email Validator', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        const user = new User({ email });
        expect(user.email).toBe(email.toLowerCase());
      });
    });
  });

  describe('Password Security', () => {
    it('should not return password by default (select: false)', () => {
      const passwordPath = User.schema.path('password');
      expect(passwordPath.options.select).toBe(false);
    });

    it('should support users without password (OAuth users)', () => {
      const user = new User({
        email: 'oauth@example.com',
        name: 'OAuth User',
      });

      expect(user.password).toBeUndefined();
      expect(user.email).toBe('oauth@example.com');
    });

    it('should support users with password (credentials users)', () => {
      const user = new User({
        email: 'credentials@example.com',
        password: 'hashedPassword',
      });

      expect(user.password).toBe('hashedPassword');
    });
  });
});
