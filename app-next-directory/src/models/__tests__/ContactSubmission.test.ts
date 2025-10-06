import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import ContactSubmission, { IContactSubmission, CONTACT_TYPES, CONTACT_STATUSES } from '../ContactSubmission';

describe('ContactSubmission Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define ContactSubmission model', () => {
      expect(ContactSubmission).toBeDefined();
      expect(ContactSubmission.modelName).toBe('ContactSubmission');
    });

    it('should have correct schema structure', () => {
      const schema = ContactSubmission.schema;
      expect(schema.path('name')).toBeDefined();
      expect(schema.path('email')).toBeDefined();
      expect(schema.path('subject')).toBeDefined();
      expect(schema.path('message')).toBeDefined();
      expect(schema.path('type')).toBeDefined();
      expect(schema.path('listingSlug')).toBeDefined();
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('ipAddress')).toBeDefined();
      expect(schema.path('status')).toBeDefined();
      expect(schema.path('notes')).toBeDefined();
    });

    it('should have required fields marked correctly', () => {
      expect(ContactSubmission.schema.path('name').isRequired).toBe(true);
      expect(ContactSubmission.schema.path('email').isRequired).toBe(true);
      expect(ContactSubmission.schema.path('subject').isRequired).toBe(true);
      expect(ContactSubmission.schema.path('message').isRequired).toBe(true);
    });

    it('should have optional fields', () => {
      expect(ContactSubmission.schema.path('listingSlug').isRequired).toBe(false);
      expect(ContactSubmission.schema.path('ipAddress').isRequired).toBe(false);
      expect(ContactSubmission.schema.path('notes').isRequired).toBe(false);
    });

    it('should have maxlength validators', () => {
      expect(ContactSubmission.schema.path('name').options.maxlength).toBe(100);
      expect(ContactSubmission.schema.path('email').options.maxlength).toBe(100);
      expect(ContactSubmission.schema.path('subject').options.maxlength).toBe(200);
      expect(ContactSubmission.schema.path('message').options.maxlength).toBe(5000);
      expect(ContactSubmission.schema.path('listingSlug').options.maxlength).toBe(200);
      expect(ContactSubmission.schema.path('ipAddress').options.maxlength).toBe(45);
      expect(ContactSubmission.schema.path('notes').options.maxlength).toBe(2000);
    });

    it('should have trim on string fields', () => {
      expect(ContactSubmission.schema.path('name').options.trim).toBe(true);
      expect(ContactSubmission.schema.path('email').options.trim).toBe(true);
      expect(ContactSubmission.schema.path('subject').options.trim).toBe(true);
      expect(ContactSubmission.schema.path('message').options.trim).toBe(true);
    });

    it('should have lowercase on email field', () => {
      expect(ContactSubmission.schema.path('email').options.lowercase).toBe(true);
    });
  });

  describe('Constants', () => {
    it('should have correct CONTACT_TYPES values', () => {
      expect(CONTACT_TYPES).toEqual(['general', 'listing', 'partnership', 'support', 'feedback']);
    });

    it('should have correct CONTACT_STATUSES values', () => {
      expect(CONTACT_STATUSES).toEqual(['unread', 'read', 'archived', 'spam']);
    });
  });

  describe('Type Field', () => {
    it('should have type field with enum validation', () => {
      const typeField = ContactSubmission.schema.path('type');
      expect(typeField.enumValues).toEqual(CONTACT_TYPES);
    });

    it('should have default type value', () => {
      const submission = new ContactSubmission({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      });
      expect(submission.type).toBe('general');
    });

    it('should accept valid type values', () => {
      CONTACT_TYPES.forEach((type) => {
        const submission = new ContactSubmission({
          name: 'Test',
          email: 'test@example.com',
          subject: 'Test',
          message: 'Message',
          type,
        });
        expect(submission.type).toBe(type);
      });
    });
  });

  describe('Status Field', () => {
    it('should have status field with enum validation', () => {
      const statusField = ContactSubmission.schema.path('status');
      expect(statusField.enumValues).toEqual(CONTACT_STATUSES);
    });

    it('should have default status value', () => {
      const submission = new ContactSubmission({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      });
      expect(submission.status).toBe('unread');
    });

    it('should accept valid status values', () => {
      CONTACT_STATUSES.forEach((status) => {
        const submission = new ContactSubmission({
          name: 'Test',
          email: 'test@example.com',
          subject: 'Test',
          message: 'Message',
          status,
        });
        expect(submission.status).toBe(status);
      });
    });
  });

  describe('Email Validation', () => {
    it('should have email validation regex', () => {
      const emailField = ContactSubmission.schema.path('email');
      expect(emailField.options.match).toBeDefined();
      expect(emailField.options.match[0]).toBeInstanceOf(RegExp);
    });

    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        const submission = new ContactSubmission({
          name: 'Test',
          email,
          subject: 'Test',
          message: 'Message',
        });
        expect(submission.email).toBe(email.toLowerCase());
      });
    });
  });

  describe('IP Address Validation', () => {
    it('should accept valid IPv4 addresses', () => {
      const ipv4Addresses = ['192.168.1.1', '10.0.0.1', '127.0.0.1', '8.8.8.8'];

      ipv4Addresses.forEach((ip) => {
        const submission = new ContactSubmission({
          name: 'Test',
          email: 'test@example.com',
          subject: 'Test',
          message: 'Message',
          ipAddress: ip,
        });
        expect(submission.ipAddress).toBe(ip);
      });
    });

    it('should accept valid IPv6 addresses', () => {
      const ipv6Addresses = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '::1',
        'fe80::1',
        '2001:db8::8a2e:370:7334',
      ];

      ipv6Addresses.forEach((ip) => {
        const submission = new ContactSubmission({
          name: 'Test',
          email: 'test@example.com',
          subject: 'Test',
          message: 'Message',
          ipAddress: ip,
        });
        expect(submission.ipAddress).toBe(ip);
      });
    });

    it('should allow empty ipAddress', () => {
      const submission = new ContactSubmission({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
      });
      expect(submission.ipAddress).toBeUndefined();
    });
  });

  describe('CreatedAt Field', () => {
    it('should have default createdAt value', () => {
      const beforeCreation = new Date();
      const submission = new ContactSubmission({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
      });
      const afterCreation = new Date();

      expect(submission.createdAt).toBeInstanceOf(Date);
      expect(submission.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(submission.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('Schema Indexes', () => {
    it('should have compound index on email and createdAt', () => {
      const indexes = ContactSubmission.schema.indexes();
      const emailCreatedAtIndex = indexes.find(
        (idx: any) => idx[0].email === 1 && idx[0].createdAt === -1
      );
      expect(emailCreatedAtIndex).toBeDefined();
    });

    it('should have compound index on status and createdAt', () => {
      const indexes = ContactSubmission.schema.indexes();
      const statusCreatedAtIndex = indexes.find(
        (idx: any) => idx[0].status === 1 && idx[0].createdAt === -1
      );
      expect(statusCreatedAtIndex).toBeDefined();
    });
  });

  describe('Model Creation', () => {
    it('should create a valid contact submission with required fields', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry about listing',
        message: 'I would like to know more about this listing.',
      };

      const submission = new ContactSubmission(data);
      expect(submission.name).toBe(data.name);
      expect(submission.email).toBe(data.email);
      expect(submission.subject).toBe(data.subject);
      expect(submission.message).toBe(data.message);
    });

    it('should create submission with all fields', () => {
      const data = {
        name: 'Jane Smith',
        email: 'JANE@EXAMPLE.COM',
        subject: 'Partnership Inquiry',
        message: 'I am interested in partnership opportunities.',
        type: 'partnership' as const,
        listingSlug: 'coworking-space-lisbon',
        ipAddress: '192.168.1.1',
        status: 'read' as const,
        notes: 'Follow up next week',
      };

      const submission = new ContactSubmission(data);
      expect(submission.name).toBe(data.name);
      expect(submission.email).toBe(data.email.toLowerCase());
      expect(submission.subject).toBe(data.subject);
      expect(submission.message).toBe(data.message);
      expect(submission.type).toBe(data.type);
      expect(submission.listingSlug).toBe(data.listingSlug);
      expect(submission.ipAddress).toBe(data.ipAddress);
      expect(submission.status).toBe(data.status);
      expect(submission.notes).toBe(data.notes);
    });

    it('should trim whitespace from string fields', () => {
      const submission = new ContactSubmission({
        name: '  John Doe  ',
        email: '  john@example.com  ',
        subject: '  Test Subject  ',
        message: '  Test message  ',
      });

      expect(submission.name).toBe('John Doe');
      expect(submission.email).toBe('john@example.com');
      expect(submission.subject).toBe('Test Subject');
      expect(submission.message).toBe('Test message');
    });

    it('should convert email to lowercase', () => {
      const submission = new ContactSubmission({
        name: 'Test',
        email: 'TEST@EXAMPLE.COM',
        subject: 'Test',
        message: 'Message',
      });

      expect(submission.email).toBe('test@example.com');
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = ContactSubmission;
      const model2 = mongoose.models.ContactSubmission;
      expect(model1).toBe(model2);
    });
  });

  describe('Listing-specific submissions', () => {
    it('should create submission for a specific listing', () => {
      const submission = new ContactSubmission({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Question about listing',
        message: 'Is WiFi available?',
        type: 'listing',
        listingSlug: 'coworking-space-bali',
      });

      expect(submission.type).toBe('listing');
      expect(submission.listingSlug).toBe('coworking-space-bali');
    });
  });

  describe('Status workflow', () => {
    it('should support status transitions', () => {
      const submission = new ContactSubmission({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Message',
        status: 'unread',
      });

      expect(submission.status).toBe('unread');

      submission.status = 'read';
      expect(submission.status).toBe('read');

      submission.status = 'archived';
      expect(submission.status).toBe('archived');
    });

    it('should mark spam submissions', () => {
      const submission = new ContactSubmission({
        name: 'Spammer',
        email: 'spam@example.com',
        subject: 'Buy now!',
        message: 'Click here to buy...',
        status: 'spam',
      });

      expect(submission.status).toBe('spam');
    });
  });
});
