import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { AnalyticsEvent } from '../AnalyticsEvent';

describe('AnalyticsEvent Model', () => {
  beforeAll(() => {});

  afterAll(() => {});

  beforeEach(() => {
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

      eventTypes.forEach(type => {
        const event = new AnalyticsEvent({ eventType: type });
        expect(event.eventType).toBe(type);
      });
    });

    it('should set default timestamp if not provided', () => {
      const beforeCreation = Date.now();
      const event = new AnalyticsEvent({ eventType: 'test' });
      const afterCreation = Date.now();

      expect(event.timestamp).toBeDefined();
      const timestampValue =
        event.timestamp instanceof Date ? event.timestamp.getTime() : Number(event.timestamp);
      expect(Number.isNaN(timestampValue)).toBe(false);
      expect(timestampValue).toBeGreaterThanOrEqual(beforeCreation);
      expect(timestampValue).toBeLessThanOrEqual(afterCreation);
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = AnalyticsEvent;
      const model2 =
        mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEvent.schema);
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

  // Note: Database operation tests have been moved to AnalyticsEvent.integration.test.ts
  // This keeps unit tests fast and focused on schema validation
});
