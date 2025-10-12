import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { AnalyticsEvent, IAnalyticsEvent } from '../AnalyticsEvent';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearInMemoryMongo } from '../../../tests/utils/dbHandler';

describe('AnalyticsEvent Model', () => {
  beforeAll(async () => {
    await connectInMemoryMongo();
  });

  afterAll(async () => {
    await disconnectInMemoryMongo();
  });

  beforeEach(async () => {
    await clearInMemoryMongo();
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define AnalyticsEvent model', () => {
      expect(AnalyticsEvent).toBeDefined();
      expect(AnalyticsEvent.modelName).toBe('AnalyticsEvent');
    });

    it('should have correct schema structure', () => {
      const schema = AnalyticsEvent.schema;
      expect(schema.path('userId')).toBeDefined();
      expect(schema.path('sessionId')).toBeDefined();
      expect(schema.path('eventType')).toBeDefined();
      expect(schema.path('eventData')).toBeDefined();
      expect(schema.path('sourceUrl')).toBeDefined();
      expect(schema.path('timestamp')).toBeDefined();
    });

    it('should have eventType as required field', () => {
      const eventType = AnalyticsEvent.schema.path('eventType');
      expect(eventType.isRequired).toBe(true);
    });

    it('should have timestamp with default value', () => {
      const timestamp = AnalyticsEvent.schema.path('timestamp');
      expect(timestamp.options.default).toBeDefined();
    });

    it('should have userId as optional field with User reference', () => {
      const userId = AnalyticsEvent.schema.path('userId');
      expect(userId.isRequired).toBe(false);
      expect(userId.options.ref).toBe('User');
    });

    it('should have sessionId as optional string field', () => {
      const sessionId = AnalyticsEvent.schema.path('sessionId');
      expect(sessionId.isRequired).toBe(false);
      expect(sessionId.instance).toBe('String');
    });

    it('should have eventData as Mixed type field', () => {
      const eventData = AnalyticsEvent.schema.path('eventData');
      expect(eventData).toBeDefined();
      expect(eventData.isRequired).toBe(false);
    });

    it('should have sourceUrl as optional string field', () => {
      const sourceUrl = AnalyticsEvent.schema.path('sourceUrl');
      expect(sourceUrl.isRequired).toBe(false);
      expect(sourceUrl.instance).toBe('String');
    });
  });

  describe('Schema Indexes', () => {
    it('should mark eventType path as indexed', () => {
      const eventTypePath = AnalyticsEvent.schema.path('eventType');
      expect(eventTypePath.options.index).toBe(true);
    });

    it('should mark timestamp path as indexed', () => {
      const timestampPath = AnalyticsEvent.schema.path('timestamp');
      expect(timestampPath.options.index).toBe(true);
    });
  });

  describe('Model Creation', () => {
    it('should create a valid analytics event with required fields', () => {
      const eventData = {
        eventType: 'contactFormSubmission',
        timestamp: new Date(),
      };

      const event = new AnalyticsEvent(eventData);
      expect(event.eventType).toBe('contactFormSubmission');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should create an event with optional fields', () => {
      const userId = new mongoose.Types.ObjectId();
      const eventData = {
        userId,
        sessionId: 'session-123',
        eventType: 'newsletterSignup',
        eventData: { formId: 'newsletter-form', source: 'homepage' },
        sourceUrl: 'https://example.com',
        timestamp: new Date(),
      };

      const event = new AnalyticsEvent(eventData);
      expect(event.userId).toEqual(userId);
      expect(event.sessionId).toBe('session-123');
      expect(event.eventType).toBe('newsletterSignup');
      expect(event.eventData).toEqual({ formId: 'newsletter-form', source: 'homepage' });
      expect(event.sourceUrl).toBe('https://example.com');
    });

    it('should create event with eventData containing various data types', () => {
      const eventData = {
        eventType: 'internalSearch',
        eventData: {
          searchTerm: 'coworking spaces',
          resultsCount: 42,
          filters: ['wifi', 'coffee'],
          timestamp: new Date(),
        },
      };

      const event = new AnalyticsEvent(eventData);
      expect(event.eventData.searchTerm).toBe('coworking spaces');
      expect(event.eventData.resultsCount).toBe(42);
      expect(event.eventData.filters).toEqual(['wifi', 'coffee']);
    });

    it('should create event with userId as ObjectId', () => {
      const userId = new mongoose.Types.ObjectId();
      const event = new AnalyticsEvent({
        userId,
        eventType: 'userRegistration',
      });

      expect(event.userId).toEqual(userId);
    });

    it('should create event with sessionId for anonymous tracking', () => {
      const event = new AnalyticsEvent({
        sessionId: 'anonymous-session-456',
        eventType: 'externalLinkClick',
        eventData: { url: 'https://external.com' },
      });

      expect(event.sessionId).toBe('anonymous-session-456');
      expect(event.userId).toBeUndefined();
    });

    it('should handle different eventType values', () => {
      const eventTypes = [
        'contactFormSubmission',
        'bookingRequest',
        'newsletterSignup',
        'userRegistration',
        'internalSearch',
        'externalLinkClick',
      ];

      eventTypes.forEach((type) => {
        const event = new AnalyticsEvent({ eventType: type });
        expect(event.eventType).toBe(type);
      });
    });

    it('should set default timestamp if not provided', () => {
      const beforeCreation = Date.now();
      const event = new AnalyticsEvent({ eventType: 'test' });
      const afterCreation = Date.now();

      expect(event.timestamp).toBeDefined();
      const timestampValue = event.timestamp instanceof Date ? event.timestamp.getTime() : Number(event.timestamp);
      expect(Number.isNaN(timestampValue)).toBe(false);
      expect(timestampValue).toBeGreaterThanOrEqual(beforeCreation);
      expect(timestampValue).toBeLessThanOrEqual(afterCreation);
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = AnalyticsEvent;
      const model2 = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEvent.schema);
      expect(model1).toBe(model2);
    });
  });

  describe('Event Data Flexibility', () => {
    it('should handle nested eventData structures', () => {
      const event = new AnalyticsEvent({
        eventType: 'complexEvent',
        eventData: {
          level1: {
            level2: {
              level3: 'deep value',
            },
          },
        },
      });

      expect(event.eventData.level1.level2.level3).toBe('deep value');
    });

    it('should handle array in eventData', () => {
      const event = new AnalyticsEvent({
        eventType: 'multipleClicks',
        eventData: {
          clicks: [
            { element: 'button1', timestamp: new Date() },
            { element: 'button2', timestamp: new Date() },
          ],
        },
      });

      expect(Array.isArray(event.eventData.clicks)).toBe(true);
      expect(event.eventData.clicks).toHaveLength(2);
    });

    it('should handle null and undefined in eventData', () => {
      const event = new AnalyticsEvent({
        eventType: 'testEvent',
        eventData: {
          nullValue: null,
          undefinedValue: undefined,
          stringValue: 'test',
        },
      });

      expect(event.eventData.nullValue).toBeNull();
      expect(event.eventData.stringValue).toBe('test');
    });
  });

  describe('Database Operations with In-Memory MongoDB', () => {
    it('should save an analytics event to database', async () => {
      const event = new AnalyticsEvent({
        eventType: 'contactFormSubmission',
        eventData: { formId: 'contact-form-1', source: 'homepage' },
        sourceUrl: 'https://example.com',
      });

      const savedEvent = await event.save();

      expect(savedEvent._id).toBeDefined();
      expect(savedEvent.eventType).toBe('contactFormSubmission');
      expect(savedEvent.timestamp).toBeInstanceOf(Date);
    });

    it('should retrieve an analytics event from database by id', async () => {
      const event = await AnalyticsEvent.create({
        eventType: 'newsletterSignup',
        sessionId: 'session-123',
        eventData: { email: 'user@example.com' },
      });

      const retrieved = await AnalyticsEvent.findById(event._id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.eventType).toBe('newsletterSignup');
      expect(retrieved?.sessionId).toBe('session-123');
    });

    it('should query events by eventType', async () => {
      await AnalyticsEvent.create([
        {
          eventType: 'contactFormSubmission',
          eventData: { formId: 'contact-1' },
        },
        {
          eventType: 'newsletterSignup',
          eventData: { email: 'user1@example.com' },
        },
        {
          eventType: 'contactFormSubmission',
          eventData: { formId: 'contact-2' },
        },
      ]);

      const contactEvents = await AnalyticsEvent.find({ eventType: 'contactFormSubmission' });

      expect(contactEvents).toHaveLength(2);
      expect(contactEvents.every(e => e.eventType === 'contactFormSubmission')).toBe(true);
    });

    it('should query events by userId', async () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();

      await AnalyticsEvent.create([
        {
          userId: userId1,
          eventType: 'userRegistration',
          eventData: { source: 'web' },
        },
        {
          userId: userId2,
          eventType: 'userRegistration',
          eventData: { source: 'mobile' },
        },
        {
          userId: userId1,
          eventType: 'internalSearch',
          eventData: { query: 'coworking' },
        },
      ]);

      const userEvents = await AnalyticsEvent.find({ userId: userId1 });

      expect(userEvents).toHaveLength(2);
      expect(userEvents.every(e => e.userId?.toString() === userId1.toString())).toBe(true);
    });

    it('should query events by sessionId for anonymous users', async () => {
      await AnalyticsEvent.create([
        {
          sessionId: 'anon-session-1',
          eventType: 'externalLinkClick',
          eventData: { url: 'https://external1.com' },
        },
        {
          sessionId: 'anon-session-2',
          eventType: 'externalLinkClick',
          eventData: { url: 'https://external2.com' },
        },
        {
          sessionId: 'anon-session-1',
          eventType: 'internalSearch',
          eventData: { query: 'test' },
        },
      ]);

      const sessionEvents = await AnalyticsEvent.find({ sessionId: 'anon-session-1' });

      expect(sessionEvents).toHaveLength(2);
      expect(sessionEvents.every(e => e.sessionId === 'anon-session-1')).toBe(true);
    });

    it('should delete an analytics event from database', async () => {
      const event = await AnalyticsEvent.create({
        eventType: 'testEvent',
        eventData: { test: true },
      });

      await AnalyticsEvent.findByIdAndDelete(event._id);

      const deleted = await AnalyticsEvent.findById(event._id);
      expect(deleted).toBeNull();
    });

    it('should sort events by timestamp descending', async () => {
      const event1 = await AnalyticsEvent.create({
        eventType: 'event1',
        timestamp: new Date('2024-01-01'),
      });

      const event2 = await AnalyticsEvent.create({
        eventType: 'event2',
        timestamp: new Date('2024-01-02'),
      });

      const events = await AnalyticsEvent.find().sort({ timestamp: -1 });

      expect(events[0]._id.toString()).toBe(event2._id.toString());
      expect(events[1]._id.toString()).toBe(event1._id.toString());
    });

    it('should count events by type', async () => {
      await AnalyticsEvent.create([
        { eventType: 'contactFormSubmission', eventData: {} },
        { eventType: 'contactFormSubmission', eventData: {} },
        { eventType: 'newsletterSignup', eventData: {} },
      ]);

      const contactCount = await AnalyticsEvent.countDocuments({ eventType: 'contactFormSubmission' });
      const newsletterCount = await AnalyticsEvent.countDocuments({ eventType: 'newsletterSignup' });

      expect(contactCount).toBe(2);
      expect(newsletterCount).toBe(1);
    });

    it('should store complex eventData in database', async () => {
      const event = await AnalyticsEvent.create({
        eventType: 'internalSearch',
        eventData: {
          query: 'coworking spaces',
          filters: ['wifi', 'coffee', 'meeting-rooms'],
          resultsCount: 42,
          location: {
            city: 'Bangkok',
            country: 'Thailand',
          },
        },
      });

      const retrieved = await AnalyticsEvent.findById(event._id);

      expect(retrieved?.eventData.query).toBe('coworking spaces');
      expect(retrieved?.eventData.filters).toEqual(['wifi', 'coffee', 'meeting-rooms']);
      expect(retrieved?.eventData.resultsCount).toBe(42);
      expect(retrieved?.eventData.location.city).toBe('Bangkok');
    });

    it('should handle bulk insert of events', async () => {
      const events = [
        { eventType: 'event1', eventData: { value: 1 } },
        { eventType: 'event2', eventData: { value: 2 } },
        { eventType: 'event3', eventData: { value: 3 } },
      ];

      await AnalyticsEvent.insertMany(events);

      const count = await AnalyticsEvent.countDocuments();
      expect(count).toBe(3);
    });

    it('should query events within a time range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await AnalyticsEvent.create([
        { eventType: 'event1', timestamp: new Date('2023-12-31') },
        { eventType: 'event2', timestamp: new Date('2024-01-15') },
        { eventType: 'event3', timestamp: new Date('2024-02-01') },
      ]);

      const eventsInRange = await AnalyticsEvent.find({
        timestamp: { $gte: startDate, $lte: endDate },
      });

      expect(eventsInRange).toHaveLength(1);
      expect(eventsInRange[0].eventType).toBe('event2');
    });

    it('should update an existing event', async () => {
      const event = await AnalyticsEvent.create({
        eventType: 'userRegistration',
        eventData: { source: 'web' },
      });

      event.eventData = { source: 'mobile', verified: true };
      await event.save();

      const updated = await AnalyticsEvent.findById(event._id);
      expect(updated?.eventData.source).toBe('mobile');
      expect(updated?.eventData.verified).toBe(true);
    });

    it('should handle pagination with skip and limit', async () => {
      await AnalyticsEvent.create([
        { eventType: 'event1', eventData: {} },
        { eventType: 'event2', eventData: {} },
        { eventType: 'event3', eventData: {} },
        { eventType: 'event4', eventData: {} },
        { eventType: 'event5', eventData: {} },
      ]);

      const page2 = await AnalyticsEvent.find()
        .sort({ timestamp: -1 })
        .skip(2)
        .limit(2);

      expect(page2).toHaveLength(2);
    });
  });
});
