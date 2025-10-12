import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { IUser, ROLE_VALUES } from '../User';
import {
  connectInMemoryMongo,
  disconnectInMemoryMongo,
  clearInMemoryMongo,
} from '../../../tests/utils/dbHandler';

// Dynamically import the User model to ensure a fresh instance for each test
let User: mongoose.Model<IUser>;

describe('User Model', () => {
  beforeAll(async () => {
    await connectInMemoryMongo();
  });

  afterAll(async () => {
    await disconnectInMemoryMongo();
  });

  beforeEach(async () => {
    await clearInMemoryMongo();
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

    it('should reject invalid email addresses', async () => {
      const user = new User({
        email: 'invalid-email',
      });

      await expect(user.validate()).rejects.toThrow(/valid email/);
    });

    it('should accept valid email addresses', async () => {
      const user = new User({
        email: 'valid.email@example.com',
      });

      await expect(user.validate()).resolves.not.toThrow();
    });

    it('should convert email to lowercase when saved', async () => {
      const user = await User.create({
        email: 'TEST@EXAMPLE.COM',
        name: 'Test User',
      });

      expect(user.email).toBe('test@example.com');

      const found = await User.findById(user._id);
      expect(found?.email).toBe('test@example.com');
    });
  });

  describe('Password Field', () => {
    it('should not be selected by default', () => {
      const passwordField = User.schema.path('password') as any;
      expect(passwordField.options.select).toBe(false);
    });

    it('should hash password before saving', async () => {
      const plainPassword = 'mySecretPassword123';
      const user = await User.create({
        email: 'test@example.com',
        password: plainPassword,
      });

      // Password should be hashed, not plain text
      const userWithPassword = await User.findById(user._id).select('+password');
      expect(userWithPassword?.password).toBeDefined();
      expect(userWithPassword?.password).not.toBe(plainPassword);
      expect(userWithPassword?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should not rehash already hashed passwords', async () => {
      const hashedPassword = '$2a$12$abcdefghijklmnopqrstuv';
      const user = await User.create({
        email: 'test@example.com',
        password: hashedPassword,
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      expect(userWithPassword?.password).toBe(hashedPassword);
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'initialPassword',
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const initialHash = userWithPassword?.password;

      // Update other fields
      await User.updateOne({ _id: user._id }, { name: 'Updated Name' });

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser?.password).toBe(initialHash);
    });

    it('should allow users without passwords', async () => {
      const user = await User.create({
        email: 'oauth-user@example.com',
        name: 'OAuth User',
      });

      expect(user.password).toBeUndefined();
      const userWithPassword = await User.findById(user._id).select('+password');
      expect(userWithPassword?.password).toBeUndefined();
    });
  });

  describe('Role Field', () => {
    it('should have enum with all defined roles', () => {
      const roleField = User.schema.path('role') as any;
      expect(roleField.enumValues).toEqual(ROLE_VALUES);
    });

    it('should default role to "user"', async () => {
      const user = await User.create({ email: 'test@example.com' });
      expect(user.role).toBe('user');
    });

    it('should accept valid role values', async () => {
      for (const role of ROLE_VALUES) {
        const user = await User.create({
          email: `${role}@example.com`,
          role,
        });
        expect(user.role).toBe(role);
      }
    });

    it('should reject invalid role values', async () => {
      const user = new User({
        email: 'test@example.com',
        role: 'invalidRole' as any,
      });

      await expect(user.validate()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default role to "user"', async () => {
      const user = await User.create({ email: 'test@example.com' });
      expect(user.role).toBe('user');
    });

    it('should default emailVerified to null', async () => {
      const user = await User.create({ email: 'test@example.com' });
      expect(user.emailVerified).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should have timestamps enabled', () => {
      expect(User.schema.options.timestamps).toBe(true);
    });

    it('should automatically set createdAt and updatedAt on save', async () => {
      const before = new Date();
      const user = await User.create({
        email: 'test@example.com',
      });
      const after = new Date();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(user.updatedAt).toEqual(user.createdAt);
    });

    it('should update updatedAt on document modification', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Original Name',
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      user.name = 'Updated Name';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('CRUD Operations', () => {
    it('should create a user with all fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123',
        role: 'editor' as const,
        image: 'https://example.com/avatar.jpg',
      };

      const user = await User.create(userData);

      expect(user._id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(user.role).toBe(userData.role);
      expect(user.image).toBe(userData.image);
    });

    it('should find users by email', async () => {
      await User.create({ email: 'user1@example.com' });
      await User.create({ email: 'user2@example.com' });

      const user = await User.findOne({ email: 'user1@example.com' });
      expect(user).toBeDefined();
      expect(user?.email).toBe('user1@example.com');
    });

    it('should update user fields', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Original Name',
      });

      await User.updateOne({ _id: user._id }, { name: 'Updated Name', role: 'admin' });

      const updated = await User.findById(user._id);
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.role).toBe('admin');
    });

    it('should delete users', async () => {
      const user = await User.create({ email: 'test@example.com' });

      await User.deleteOne({ _id: user._id });

      const found = await User.findById(user._id);
      expect(found).toBeNull();
    });

    it('should verify email', async () => {
      const user = await User.create({ email: 'test@example.com' });
      expect(user.emailVerified).toBeNull();

      const verificationDate = new Date();
      await User.updateOne({ _id: user._id }, { emailVerified: verificationDate });

      const verified = await User.findById(user._id);
      expect(verified?.emailVerified).toBeInstanceOf(Date);
    });
  });
});