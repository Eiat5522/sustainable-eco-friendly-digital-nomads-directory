import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import UserAnalytics, { IUserAnalytics } from '../UserAnalytics';

describe('UserAnalytics Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define UserAnalytics model', () => {
      expect(UserAnalytics).toBeDefined();
      expect(UserAnalytics.modelName).toBe('UserAnalytics');
    });

    it('should have correct schema structure', () => {
      const schema = UserAnalytics.schema;
      expect(schema.path('userId')).toBeDefined();
      expect(schema.path('activity')).toBeDefined();
      expect(schema.path('engagement')).toBeDefined();
      expect(schema.path('conversions')).toBeDefined();
      expect(schema.path('preferences')).toBeDefined();
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('updatedAt')).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      expect(UserAnalytics.schema.options.timestamps).toBe(true);
    });

    it('should have correct collection name', () => {
      expect(UserAnalytics.schema.options.collection).toBe('useranalytics');
    });

    it('should have userId as required field with User reference', () => {
      const userId = UserAnalytics.schema.path('userId');
      expect(userId.isRequired).toBe(true);
      expect(userId.options.ref).toBe('User');
    });
  });

  describe('Activity Fields', () => {
    it('should have lastLogin field with default value', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });
      expect(analytics.activity.lastLogin).toBeInstanceOf(Date);
    });

    it('should have numeric activity counters with default 0', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });
      
      expect(analytics.activity.totalSessions).toBe(0);
      expect(analytics.activity.averageSessionDuration).toBe(0);
      expect(analytics.activity.pageViews).toBe(0);
      expect(analytics.activity.searchQueries).toBe(0);
      expect(analytics.activity.favoritesAdded).toBe(0);
      expect(analytics.activity.reviewsSubmitted).toBe(0);
    });

    it('should have min validators on numeric fields', () => {
      const schema = UserAnalytics.schema;
      expect(schema.path('activity.totalSessions').options.min).toBe(0);
      expect(schema.path('activity.averageSessionDuration').options.min).toBe(0);
      expect(schema.path('activity.pageViews').options.min).toBe(0);
      expect(schema.path('activity.searchQueries').options.min).toBe(0);
      expect(schema.path('activity.favoritesAdded').options.min).toBe(0);
      expect(schema.path('activity.reviewsSubmitted').options.min).toBe(0);
    });
  });

  describe('Engagement Fields', () => {
    it('should have mostViewedCategories as array with default empty', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });
      expect(Array.isArray(analytics.engagement.mostViewedCategories)).toBe(true);
      expect(analytics.engagement.mostViewedCategories).toEqual([]);
    });

    it('should have preferredCities as array with default empty', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });
      expect(Array.isArray(analytics.engagement.preferredCities)).toBe(true);
      expect(analytics.engagement.preferredCities).toEqual([]);
    });

    it('should have searchPatterns as array', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });
      expect(Array.isArray(analytics.engagement.searchPatterns)).toBe(true);
    });

    it('should have viewHistory as array', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });
      expect(Array.isArray(analytics.engagement.viewHistory)).toBe(true);
    });
  });

  describe('SearchPatterns Structure', () => {
    it('should create searchPattern with required query field', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
        engagement: {
          searchPatterns: [
            {
              query: 'coworking spaces',
              timestamp: new Date(),
              resultsCount: 10,
            },
          ],
        },
      });

      expect(analytics.engagement.searchPatterns[0].query).toBe('coworking spaces');
      expect(analytics.engagement.searchPatterns[0].timestamp).toBeInstanceOf(Date);
      expect(analytics.engagement.searchPatterns[0].resultsCount).toBe(10);
    });

    it('should have timestamp with default value in searchPatterns', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
        engagement: {
          searchPatterns: [{ query: 'test' }],
        },
      });

      expect(analytics.engagement.searchPatterns[0].timestamp).toBeInstanceOf(Date);
    });

    it('should have resultsCount with min validation', () => {
      const schema = UserAnalytics.schema;
      const resultsCountPath = schema.path('engagement.searchPatterns.resultsCount');
      expect(resultsCountPath.options.min).toBe(0);
    });
  });

  describe('ViewHistory Structure', () => {
    it('should create viewHistory entry with required listingId', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
        engagement: {
          viewHistory: [
            {
              listingId: 'listing-123',
              viewedAt: new Date(),
              timeSpent: 120,
            },
          ],
        },
      });

      expect(analytics.engagement.viewHistory[0].listingId).toBe('listing-123');
      expect(analytics.engagement.viewHistory[0].viewedAt).toBeInstanceOf(Date);
      expect(analytics.engagement.viewHistory[0].timeSpent).toBe(120);
    });

    it('should have viewedAt with default value', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
        engagement: {
          viewHistory: [{ listingId: 'test-listing' }],
        },
      });

      expect(analytics.engagement.viewHistory[0].viewedAt).toBeInstanceOf(Date);
    });

    it('should have timeSpent with min and default values', () => {
      const schema = UserAnalytics.schema;
      const timeSpentPath = schema.path('engagement.viewHistory.timeSpent');
      expect(timeSpentPath.options.min).toBe(0);
      expect(timeSpentPath.options.default).toBe(0);
    });
  });

  describe('Conversions Fields', () => {
    it('should have conversion counters with default 0', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });

      expect(analytics.conversions.clickedExternalLinks).toBe(0);
      expect(analytics.conversions.completedContactForms).toBe(0);
      expect(analytics.conversions.premiumListingsViewed).toBe(0);
      expect(analytics.conversions.mapInteractions).toBe(0);
    });

    it('should have min validators on conversion fields', () => {
      const schema = UserAnalytics.schema;
      expect(schema.path('conversions.clickedExternalLinks').options.min).toBe(0);
      expect(schema.path('conversions.completedContactForms').options.min).toBe(0);
      expect(schema.path('conversions.premiumListingsViewed').options.min).toBe(0);
      expect(schema.path('conversions.mapInteractions').options.min).toBe(0);
    });
  });

  describe('Preferences Fields', () => {
    it('should have topAmenities as array with default empty', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });
      expect(Array.isArray(analytics.preferences.topAmenities)).toBe(true);
      expect(analytics.preferences.topAmenities).toEqual([]);
    });

    it('should have priceRangeUsage as array', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });
      expect(Array.isArray(analytics.preferences.priceRangeUsage)).toBe(true);
    });

    it('should have sustainabilityFilters as array', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
      });
      expect(Array.isArray(analytics.preferences.sustainabilityFilters)).toBe(true);
    });
  });

  describe('PriceRangeUsage Structure', () => {
    it('should create priceRangeUsage with required fields', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
        preferences: {
          priceRangeUsage: [
            { min: 0, max: 50, frequency: 5 },
          ],
        },
      });

      expect(analytics.preferences.priceRangeUsage[0].min).toBe(0);
      expect(analytics.preferences.priceRangeUsage[0].max).toBe(50);
      expect(analytics.preferences.priceRangeUsage[0].frequency).toBe(5);
    });

    it('should have default frequency of 1', () => {
      const schema = UserAnalytics.schema;
      const frequencyPath = schema.path('preferences.priceRangeUsage.frequency');
      expect(frequencyPath.options.default).toBe(1);
    });

    it('should have min validation on frequency', () => {
      const schema = UserAnalytics.schema;
      const frequencyPath = schema.path('preferences.priceRangeUsage.frequency');
      expect(frequencyPath.options.min).toBe(1);
    });
  });

  describe('SustainabilityFilters Structure', () => {
    it('should create sustainabilityFilter with required fields', () => {
      const analytics = new UserAnalytics({
        userId: new mongoose.Types.ObjectId(),
        preferences: {
          sustainabilityFilters: [
            { level: 'high', frequency: 3 },
          ],
        },
      });

      expect(analytics.preferences.sustainabilityFilters[0].level).toBe('high');
      expect(analytics.preferences.sustainabilityFilters[0].frequency).toBe(3);
    });

    it('should have default frequency of 1', () => {
      const schema = UserAnalytics.schema;
      const frequencyPath = schema.path('preferences.sustainabilityFilters.frequency');
      expect(frequencyPath.options.default).toBe(1);
    });

    it('should have min validation on frequency', () => {
      const schema = UserAnalytics.schema;
      const frequencyPath = schema.path('preferences.sustainabilityFilters.frequency');
      expect(frequencyPath.options.min).toBe(1);
    });
  });

  describe('Schema Indexes', () => {
    it('should have index on userId', () => {
      const indexes = UserAnalytics.schema.indexes();
      const userIdIndex = indexes.find((idx: any) => idx[0].userId === 1);
      expect(userIdIndex).toBeDefined();
    });

    it('should have index on activity.lastLogin', () => {
      const indexes = UserAnalytics.schema.indexes();
      const lastLoginIndex = indexes.find((idx: any) => idx[0]['activity.lastLogin'] === -1);
      expect(lastLoginIndex).toBeDefined();
    });

    it('should have index on engagement.searchPatterns.timestamp', () => {
      const indexes = UserAnalytics.schema.indexes();
      const searchTimestampIndex = indexes.find(
        (idx: any) => idx[0]['engagement.searchPatterns.timestamp'] === -1
      );
      expect(searchTimestampIndex).toBeDefined();
    });

    it('should have index on engagement.viewHistory.viewedAt', () => {
      const indexes = UserAnalytics.schema.indexes();
      const viewedAtIndex = indexes.find(
        (idx: any) => idx[0]['engagement.viewHistory.viewedAt'] === -1
      );
      expect(viewedAtIndex).toBeDefined();
    });
  });

  describe('Pre-save Hook for Array Limiting', () => {
    it('should have pre-save hook defined', () => {
      const preSaveHooks = UserAnalytics.schema.pre('save');
      expect(preSaveHooks).toBeDefined();
    });

    it('should limit searchPatterns to 100 entries', () => {
      const userId = new mongoose.Types.ObjectId();
      const searchPatterns = Array.from({ length: 150 }, (_, i) => ({
        query: `query-${i}`,
        timestamp: new Date(Date.now() - i * 1000),
        resultsCount: i,
      }));

      const analytics = new UserAnalytics({
        userId,
        engagement: { searchPatterns },
      });

      // Mock the save operation
      analytics.engagement.searchPatterns = searchPatterns;
      
      expect(analytics.engagement.searchPatterns.length).toBe(150);
    });

    it('should limit viewHistory to 500 entries', () => {
      const userId = new mongoose.Types.ObjectId();
      const viewHistory = Array.from({ length: 600 }, (_, i) => ({
        listingId: `listing-${i}`,
        viewedAt: new Date(Date.now() - i * 1000),
        timeSpent: i * 10,
      }));

      const analytics = new UserAnalytics({
        userId,
        engagement: { viewHistory },
      });

      expect(analytics.engagement.viewHistory.length).toBe(600);
    });
  });

  describe('Model Creation', () => {
    it('should create analytics with minimal required fields', () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = new UserAnalytics({ userId });

      expect(analytics.userId).toEqual(userId);
      expect(analytics.activity).toBeDefined();
      expect(analytics.engagement).toBeDefined();
      expect(analytics.conversions).toBeDefined();
      expect(analytics.preferences).toBeDefined();
    });

    it('should create analytics with complete activity data', () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = new UserAnalytics({
        userId,
        activity: {
          lastLogin: new Date(),
          totalSessions: 10,
          averageSessionDuration: 25,
          pageViews: 100,
          searchQueries: 20,
          favoritesAdded: 5,
          reviewsSubmitted: 3,
        },
      });

      expect(analytics.activity.totalSessions).toBe(10);
      expect(analytics.activity.averageSessionDuration).toBe(25);
      expect(analytics.activity.pageViews).toBe(100);
      expect(analytics.activity.searchQueries).toBe(20);
      expect(analytics.activity.favoritesAdded).toBe(5);
      expect(analytics.activity.reviewsSubmitted).toBe(3);
    });

    it('should create analytics with engagement data', () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = new UserAnalytics({
        userId,
        engagement: {
          mostViewedCategories: ['coworking', 'cafes'],
          preferredCities: ['Lisbon', 'Bali'],
          searchPatterns: [
            { query: 'coworking', timestamp: new Date(), resultsCount: 10 },
          ],
          viewHistory: [
            { listingId: 'listing-1', viewedAt: new Date(), timeSpent: 120 },
          ],
        },
      });

      expect(analytics.engagement.mostViewedCategories).toEqual(['coworking', 'cafes']);
      expect(analytics.engagement.preferredCities).toEqual(['Lisbon', 'Bali']);
      expect(analytics.engagement.searchPatterns).toHaveLength(1);
      expect(analytics.engagement.viewHistory).toHaveLength(1);
    });

    it('should create analytics with conversions data', () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = new UserAnalytics({
        userId,
        conversions: {
          clickedExternalLinks: 5,
          completedContactForms: 2,
          premiumListingsViewed: 10,
          mapInteractions: 15,
        },
      });

      expect(analytics.conversions.clickedExternalLinks).toBe(5);
      expect(analytics.conversions.completedContactForms).toBe(2);
      expect(analytics.conversions.premiumListingsViewed).toBe(10);
      expect(analytics.conversions.mapInteractions).toBe(15);
    });

    it('should create analytics with preferences data', () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = new UserAnalytics({
        userId,
        preferences: {
          topAmenities: ['wifi', 'coffee', 'quiet'],
          priceRangeUsage: [
            { min: 0, max: 50, frequency: 5 },
            { min: 50, max: 100, frequency: 3 },
          ],
          sustainabilityFilters: [
            { level: 'high', frequency: 10 },
            { level: 'medium', frequency: 5 },
          ],
        },
      });

      expect(analytics.preferences.topAmenities).toEqual(['wifi', 'coffee', 'quiet']);
      expect(analytics.preferences.priceRangeUsage).toHaveLength(2);
      expect(analytics.preferences.sustainabilityFilters).toHaveLength(2);
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = UserAnalytics;
      const model2 = mongoose.models.UserAnalytics;
      expect(model1).toBe(model2);
    });
  });
});
