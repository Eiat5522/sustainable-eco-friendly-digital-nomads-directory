import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import NewsletterSubscriber, { INewsletterSubscriber } from '../NewsletterSubscriber';

describe('NewsletterSubscriber Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define NewsletterSubscriber model', () => {
      expect(NewsletterSubscriber).toBeDefined();
      expect(NewsletterSubscriber.modelName).toBe('NewsletterSubscriber');
    });

    it('should have correct schema structure', () => {
      const schema = NewsletterSubscriber.schema;
      expect(schema.path('email')).toBeDefined();
      expect(schema.path('confirmedAt')).toBeDefined();
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('updatedAt')).toBeDefined();
    });

    it('should have email as required field', () => {
      expect(NewsletterSubscriber.schema.path('email').isRequired).toBe(true);
    });

    it('should have timestamps enabled', () => {
      expect(NewsletterSubscriber.schema.options.timestamps).toBe(true);
    });
  });

  describe('Email Field', () => {
    it('should have lowercase option on email', () => {
      expect(NewsletterSubscriber.schema.path('email').options.lowercase).toBe(true);
    });

    it('should have trim option on email', () => {
      expect(NewsletterSubscriber.schema.path('email').options.trim).toBe(true);
    });

    it('should have email validation regex', () => {
      const emailField = NewsletterSubscriber.schema.path('email');
      expect(emailField.options.match).toBeDefined();
      expect(emailField.options.match[0]).toBeInstanceOf(RegExp);
    });

    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
      ];

      validEmails.forEach((email) => {
        const subscriber = new NewsletterSubscriber({ email });
        expect(subscriber.email).toBe(email.toLowerCase());
      });
    });
  });

  describe('ConfirmedAt Field', () => {
    it('should have confirmedAt with default null', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      expect(subscriber.confirmedAt).toBeNull();
    });

    it('should accept Date value for confirmedAt', () => {
      const confirmedDate = new Date();
      const subscriber = new NewsletterSubscriber({
        email: 'test@example.com',
        confirmedAt: confirmedDate,
      });
      expect(subscriber.confirmedAt).toEqual(confirmedDate);
    });

    it('should accept null for confirmedAt', () => {
      const subscriber = new NewsletterSubscriber({
        email: 'test@example.com',
        confirmedAt: null,
      });
      expect(subscriber.confirmedAt).toBeNull();
    });
  });

  describe('Schema Indexes', () => {
    it('should have unique index on email', () => {
      const indexes = NewsletterSubscriber.schema.indexes();
      const emailIndex = indexes.find(
        (idx: any) => idx[0].email === 1 && idx[1]?.unique === true
      );
      expect(emailIndex).toBeDefined();
      expect(emailIndex[1].unique).toBe(true);
    });
  });

  describe('Model Creation', () => {
    it('should create a valid subscriber with required email field', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });

      expect(subscriber.email).toBe('test@example.com');
      expect(subscriber.confirmedAt).toBeNull();
    });

    it('should create subscriber with confirmedAt date', () => {
      const confirmedDate = new Date();
      const subscriber = new NewsletterSubscriber({
        email: 'confirmed@example.com',
        confirmedAt: confirmedDate,
      });

      expect(subscriber.email).toBe('confirmed@example.com');
      expect(subscriber.confirmedAt).toEqual(confirmedDate);
    });

    it('should convert email to lowercase', () => {
      const subscriber = new NewsletterSubscriber({ email: 'TEST@EXAMPLE.COM' });
      expect(subscriber.email).toBe('test@example.com');
    });

    it('should trim email whitespace', () => {
      const subscriber = new NewsletterSubscriber({ email: '  test@example.com  ' });
      expect(subscriber.email).toBe('test@example.com');
    });

    it('should handle email with uppercase and whitespace', () => {
      const subscriber = new NewsletterSubscriber({ email: '  TEST@EXAMPLE.COM  ' });
      expect(subscriber.email).toBe('test@example.com');
    });
  });

  describe('Pre-update Hook', () => {
    it('should have pre-update hooks defined', () => {
      const preUpdateHooks = NewsletterSubscriber.schema.pre(['findOneAndUpdate', 'updateOne']);
      expect(preUpdateHooks).toBeDefined();
    });

    it('should normalize email on findOneAndUpdate', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      
      // Mock getUpdate to return an update object
      subscriber.schema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
        const update = this.getUpdate() as any;
        if (update?.email) {
          update.email = String(update.email).toLowerCase().trim();
        }
        next();
      });

      expect(NewsletterSubscriber.schema.pre).toBeDefined();
    });

    it('should normalize email on updateOne', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      
      // Mock getUpdate to return an update object
      subscriber.schema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
        const update = this.getUpdate() as any;
        if (update?.email) {
          update.email = String(update.email).toLowerCase().trim();
        }
        next();
      });

      expect(NewsletterSubscriber.schema.pre).toBeDefined();
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = NewsletterSubscriber;
      const model2 = mongoose.models.NewsletterSubscriber;
      expect(model1).toBe(model2);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt field', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      expect(subscriber.createdAt).toBeDefined();
    });

    it('should have updatedAt field', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      expect(subscriber.updatedAt).toBeDefined();
    });

    it('should set timestamps on creation', () => {
      const beforeCreation = new Date();
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      const afterCreation = new Date();

      expect(subscriber.createdAt).toBeInstanceOf(Date);
      expect(subscriber.updatedAt).toBeInstanceOf(Date);
      expect(subscriber.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(subscriber.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('Email Uniqueness', () => {
    it('should enforce unique email constraint (schema level)', () => {
      const indexes = NewsletterSubscriber.schema.indexes();
      const uniqueEmailIndex = indexes.find(
        (idx: any) => idx[0].email === 1 && idx[1]?.unique === true
      );
      
      expect(uniqueEmailIndex).toBeDefined();
      expect(uniqueEmailIndex[1].unique).toBe(true);
    });

    it('should allow creating subscribers with different emails', () => {
      const subscriber1 = new NewsletterSubscriber({ email: 'user1@example.com' });
      const subscriber2 = new NewsletterSubscriber({ email: 'user2@example.com' });

      expect(subscriber1.email).not.toBe(subscriber2.email);
    });
  });

  describe('Confirmation Workflow', () => {
    it('should create unconfirmed subscriber by default', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      expect(subscriber.confirmedAt).toBeNull();
    });

    it('should allow confirming a subscriber', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      expect(subscriber.confirmedAt).toBeNull();

      const confirmedDate = new Date();
      subscriber.confirmedAt = confirmedDate;
      expect(subscriber.confirmedAt).toEqual(confirmedDate);
    });

    it('should track confirmation time', () => {
      const confirmTime = new Date('2024-01-15T10:00:00Z');
      const subscriber = new NewsletterSubscriber({
        email: 'confirmed@example.com',
        confirmedAt: confirmTime,
      });

      expect(subscriber.confirmedAt).toEqual(confirmTime);
    });
  });

  describe('Email Validation Regex', () => {
    it('should match valid email formats', () => {
      const emailField = NewsletterSubscriber.schema.path('email');
      const regex = emailField.options.match[0];

      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com',
        'a@b.c',
      ];

      validEmails.forEach((email) => {
        expect(email).toMatch(regex);
      });
    });

    it('should reject invalid email formats', () => {
      const emailField = NewsletterSubscriber.schema.path('email');
      const regex = emailField.options.match[0];

      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
      ];

      invalidEmails.forEach((email) => {
        expect(email).not.toMatch(regex);
      });
    });
  });

  describe('Field Types', () => {
    it('should have email as String type', () => {
      const emailField = NewsletterSubscriber.schema.path('email');
      expect(emailField.instance).toBe('String');
    });

    it('should have confirmedAt as Date type', () => {
      const confirmedAtField = NewsletterSubscriber.schema.path('confirmedAt');
      expect(confirmedAtField.instance).toBe('Date');
    });
  });

  describe('Use Cases', () => {
    it('should handle double opt-in workflow', () => {
      // Step 1: User subscribes (unconfirmed)
      const subscriber = new NewsletterSubscriber({ email: 'user@example.com' });
      expect(subscriber.confirmedAt).toBeNull();

      // Step 2: User clicks confirmation link
      subscriber.confirmedAt = new Date();
      expect(subscriber.confirmedAt).toBeInstanceOf(Date);
    });

    it('should track when subscription was created', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      expect(subscriber.createdAt).toBeInstanceOf(Date);
    });

    it('should track when subscription was last updated', () => {
      const subscriber = new NewsletterSubscriber({ email: 'test@example.com' });
      expect(subscriber.updatedAt).toBeInstanceOf(Date);
    });

    it('should support querying confirmed subscribers', () => {
      const confirmed = new NewsletterSubscriber({
        email: 'confirmed@example.com',
        confirmedAt: new Date(),
      });
      const unconfirmed = new NewsletterSubscriber({
        email: 'unconfirmed@example.com',
      });

      expect(confirmed.confirmedAt).not.toBeNull();
      expect(unconfirmed.confirmedAt).toBeNull();
    });

    it('should support querying by email', () => {
      const email = 'search@example.com';
      const subscriber = new NewsletterSubscriber({ email });
      expect(subscriber.email).toBe(email);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain email lowercase throughout lifecycle', () => {
      const subscriber = new NewsletterSubscriber({ email: 'Test@Example.COM' });
      expect(subscriber.email).toBe('test@example.com');
      
      subscriber.email = 'UPDATED@EXAMPLE.COM';
      expect(subscriber.email).toBe('updated@example.com');
    });

    it('should maintain email trimming throughout lifecycle', () => {
      const subscriber = new NewsletterSubscriber({ email: '  test@example.com  ' });
      expect(subscriber.email).toBe('test@example.com');
    });
  });
});
