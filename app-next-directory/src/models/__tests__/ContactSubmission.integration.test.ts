import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import ContactSubmission, { CONTACT_TYPES, CONTACT_STATUSES } from '../ContactSubmission';

const getMongoose = async () => {
  const mod = await import('mongoose');
  return mod.default ?? (mod as unknown as typeof import('mongoose'));
};

/**
 * Integration tests for ContactSubmission model with real MongoDB operations.
 * These tests use mongodb-memory-server to test actual database CRUD operations.
 * 
 * Run these tests with: npm run test:integration
 */
describe('ContactSubmission Model (Integration)', () => {
  let mongo: MongoMemoryServer;
  let mongoose: typeof import('mongoose');

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongo = await MongoMemoryServer.create();
    mongoose = await getMongoose();
    await mongoose.connect(mongo.getUri(), { bufferCommands: false });
  });

  beforeEach(async () => {
    // Clear all collections before each test
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      await Promise.all(
        Object.values(collections).map(async (collection) => {
          await collection.deleteMany({});
        })
      );
    }
  });

  afterEach(async () => {
    // Additional cleanup if needed
  });

  afterAll(async () => {
    // Cleanup: disconnect and stop server
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    await mongo.stop();
  });

  describe('Database Operations', () => {
    it('should save a contact submission to database', async () => {
      const submission = new ContactSubmission({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message for database operations.',
        type: 'general',
      });

      const savedSubmission = await submission.save();

      expect(savedSubmission._id).toBeDefined();
      expect(savedSubmission.name).toBe('John Doe');
      expect(savedSubmission.email).toBe('john@example.com');
      expect(savedSubmission.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve a contact submission from database by id', async () => {
      const submission = await ContactSubmission.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Query',
        message: 'I have a question about your services.',
      });

      const retrieved = await ContactSubmission.findById(submission._id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Jane Smith');
      expect(retrieved?.email).toBe('jane@example.com');
    });

    it('should update a contact submission status', async () => {
      const submission = await ContactSubmission.create({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
        status: 'unread',
      });

      submission.status = 'read';
      submission.notes = 'Responded to customer';
      await submission.save();

      const updated = await ContactSubmission.findById(submission._id);
      expect(updated?.status).toBe('read');
      expect(updated?.notes).toBe('Responded to customer');
    });

    it('should delete a contact submission from database', async () => {
      const submission = await ContactSubmission.create({
        name: 'Delete Test',
        email: 'delete@example.com',
        subject: 'Delete me',
        message: 'This will be deleted',
      });

      await ContactSubmission.findByIdAndDelete(submission._id);

      const deleted = await ContactSubmission.findById(submission._id);
      expect(deleted).toBeNull();
    });

    it('should query submissions by email', async () => {
      await ContactSubmission.create([
        {
          name: 'User 1',
          email: 'same@example.com',
          subject: 'First message',
          message: 'Message 1',
        },
        {
          name: 'User 2',
          email: 'same@example.com',
          subject: 'Second message',
          message: 'Message 2',
        },
        {
          name: 'User 3',
          email: 'different@example.com',
          subject: 'Different',
          message: 'Message 3',
        },
      ]);

      const submissions = await ContactSubmission.find({ email: 'same@example.com' });

      expect(submissions).toHaveLength(2);
      expect(submissions.every(s => s.email === 'same@example.com')).toBe(true);
    });

    it('should query submissions by status', async () => {
      await ContactSubmission.create([
        {
          name: 'User 1',
          email: 'user1@example.com',
          subject: 'Subject 1',
          message: 'Message 1',
          status: 'unread',
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          subject: 'Subject 2',
          message: 'Message 2',
          status: 'read',
        },
        {
          name: 'User 3',
          email: 'user3@example.com',
          subject: 'Subject 3',
          message: 'Message 3',
          status: 'unread',
        },
      ]);

      const unreadSubmissions = await ContactSubmission.find({ status: 'unread' });

      expect(unreadSubmissions).toHaveLength(2);
      expect(unreadSubmissions.every(s => s.status === 'unread')).toBe(true);
    });

    it('should sort submissions by createdAt descending', async () => {
      const submission1 = await ContactSubmission.create({
        name: 'First',
        email: 'first@example.com',
        subject: 'First',
        message: 'First message',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const submission2 = await ContactSubmission.create({
        name: 'Second',
        email: 'second@example.com',
        subject: 'Second',
        message: 'Second message',
      });

      const submissions = await ContactSubmission.find().sort({ createdAt: -1 });

      expect(submissions[0]._id.toString()).toBe(submission2._id.toString());
      expect(submissions[1]._id.toString()).toBe(submission1._id.toString());
    });

    it('should count total submissions', async () => {
      await ContactSubmission.create([
        {
          name: 'User 1',
          email: 'user1@example.com',
          subject: 'Subject 1',
          message: 'Message 1',
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          subject: 'Subject 2',
          message: 'Message 2',
        },
        {
          name: 'User 3',
          email: 'user3@example.com',
          subject: 'Subject 3',
          message: 'Message 3',
        },
      ]);

      const count = await ContactSubmission.countDocuments();

      expect(count).toBe(3);
    });

    it('should handle pagination with skip and limit', async () => {
      await ContactSubmission.create([
        {
          name: 'User 1',
          email: 'user1@example.com',
          subject: 'Subject 1',
          message: 'Message 1',
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          subject: 'Subject 2',
          message: 'Message 2',
        },
        {
          name: 'User 3',
          email: 'user3@example.com',
          subject: 'Subject 3',
          message: 'Message 3',
        },
        {
          name: 'User 4',
          email: 'user4@example.com',
          subject: 'Subject 4',
          message: 'Message 4',
        },
      ]);

      const page2 = await ContactSubmission.find()
        .sort({ createdAt: -1 })
        .skip(2)
        .limit(2);

      expect(page2).toHaveLength(2);
    });

    it('should store and retrieve ipAddress', async () => {
      const submission = await ContactSubmission.create({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
        ipAddress: '192.168.1.1',
      });

      const retrieved = await ContactSubmission.findById(submission._id);
      expect(retrieved?.ipAddress).toBe('192.168.1.1');
    });

    it('should store and retrieve listingSlug', async () => {
      const submission = await ContactSubmission.create({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Question about listing',
        message: 'Is this available?',
        type: 'listing',
        listingSlug: 'eco-hotel-bali',
      });

      const retrieved = await ContactSubmission.findById(submission._id);
      expect(retrieved?.listingSlug).toBe('eco-hotel-bali');
    });
  });
});
