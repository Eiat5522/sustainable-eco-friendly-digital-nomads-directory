import mongoose from 'mongoose';
import UserAnalytics from '../UserAnalytics';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearInMemoryMongo } from '../../../tests/utils/dbHandler';

describe('UserAnalytics model schema', () => {
  const schema = UserAnalytics.schema as any;

  beforeAll(async () => {
    await connectInMemoryMongo();
  });

  afterAll(async () => {
    await disconnectInMemoryMongo();
  });

  beforeEach(async () => {
    await clearInMemoryMongo();
  });

  it('exposes the compiled model with expected metadata', () => {
    expect(UserAnalytics).toBeDefined();
    expect(UserAnalytics.modelName).toBe('UserAnalytics');
    expect(schema.options.timestamps).toBe(true);
    expect(schema.options.collection).toBe('useranalytics');

    const userIdPath = schema.path('userId');
    expect(userIdPath).toBeDefined();
    expect(userIdPath.options.required).toBe(true);
    expect(userIdPath.options.ref).toBe('User');
  });

  it('configures activity defaults and validators', () => {
    const activity = schema.path('activity').options;

    expect(typeof activity.lastLogin.default).toBe('function');
    expect(activity.totalSessions.default).toBe(0);
    expect(activity.totalSessions.min).toBe(0);
    expect(activity.averageSessionDuration.default).toBe(0);
    expect(activity.pageViews.min).toBe(0);
    expect(activity.searchQueries.min).toBe(0);
    expect(activity.favoritesAdded.min).toBe(0);
    expect(activity.reviewsSubmitted.min).toBe(0);
  });

  it('configures engagement subdocuments', () => {
    const engagement = schema.path('engagement').options;

    expect(engagement.mostViewedCategories.default).toEqual([]);
    expect(engagement.preferredCities.default).toEqual([]);

    const searchPattern = engagement.searchPatterns[0];
    expect(searchPattern.query.required).toBe(true);
    expect(typeof searchPattern.timestamp.default).toBe('function');
    expect(searchPattern.resultsCount.min).toBe(0);

    const viewHistory = engagement.viewHistory[0];
    expect(viewHistory.listingId.required).toBe(true);
    expect(typeof viewHistory.viewedAt.default).toBe('function');
    expect(viewHistory.timeSpent.default).toBe(0);
    expect(viewHistory.timeSpent.min).toBe(0);
  });

  it('configures conversion counters', () => {
    const conversions = schema.path('conversions').options;

    expect(conversions.clickedExternalLinks.default).toBe(0);
    expect(conversions.clickedExternalLinks.min).toBe(0);
    expect(conversions.completedContactForms.default).toBe(0);
    expect(conversions.premiumListingsViewed.min).toBe(0);
    expect(conversions.mapInteractions.default).toBe(0);
  });

  it('configures preferences arrays', () => {
    const preferences = schema.path('preferences').options;

    expect(preferences.topAmenities.default).toEqual([]);

    const priceRange = preferences.priceRangeUsage[0];
    expect(priceRange.min.required).toBe(true);
    expect(priceRange.max.required).toBe(true);
    expect(priceRange.frequency.default).toBe(1);
    expect(priceRange.frequency.min).toBe(1);

    const sustainability = preferences.sustainabilityFilters[0];
    expect(sustainability.level.required).toBe(true);
    expect(sustainability.frequency.default).toBe(1);
    expect(sustainability.frequency.min).toBe(1);
  });

  it('registers indexes for common queries', () => {
    const indexes = schema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        [ { userId: 1 }, {} ],
        [ { 'activity.lastLogin': -1 }, {} ],
        [ { 'engagement.searchPatterns.timestamp': -1 }, {} ],
        [ { 'engagement.viewHistory.viewedAt': -1 }, {} ],
      ])
    );
  });

  it('limits analytics arrays via the pre-save hook', () => {
    const preHooks: Array<(this: any, next?: () => void) => void> = schema.preHooks?.get('save') ?? [];
    expect(preHooks.length).toBeGreaterThan(0);

    const doc = {
      engagement: {
        searchPatterns: Array.from({ length: 150 }, (_, i) => ({
          query: `query-${i}`,
          timestamp: new Date(Date.now() - i * 1000),
          resultsCount: i,
        })),
        viewHistory: Array.from({ length: 600 }, (_, i) => ({
          listingId: `listing-${i}`,
          viewedAt: new Date(Date.now() - i * 1000),
          timeSpent: i,
        })),
      },
    };

    preHooks.forEach((hook) => hook.call(doc, () => {}));

    expect(doc.engagement.searchPatterns).toHaveLength(100);
    expect(doc.engagement.viewHistory).toHaveLength(500);
  });

  it('reuses the compiled model from mongoose.models', () => {
    expect(mongoose.models.UserAnalytics).toBe(UserAnalytics);
  });

  describe('Database Operations with In-Memory MongoDB', () => {
    it('should create a new UserAnalytics document', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({
        userId,
        activity: {
          lastLogin: new Date(),
          totalSessions: 5,
          averageSessionDuration: 15,
          pageViews: 50,
          searchQueries: 10,
          favoritesAdded: 3,
          reviewsSubmitted: 2,
        },
      });

      expect(analytics._id).toBeDefined();
      expect(analytics.userId.toString()).toBe(userId.toString());
      expect(analytics.activity.totalSessions).toBe(5);
      expect(analytics.createdAt).toBeInstanceOf(Date);
      expect(analytics.updatedAt).toBeInstanceOf(Date);
    });

    it('should retrieve UserAnalytics by userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      await UserAnalytics.create({
        userId,
        activity: {
          lastLogin: new Date(),
          totalSessions: 1,
        },
      });

      const retrieved = await UserAnalytics.findOne({ userId });

      expect(retrieved).toBeDefined();
      expect(retrieved?.userId.toString()).toBe(userId.toString());
    });

    it('should update UserAnalytics activity metrics', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({
        userId,
        activity: {
          lastLogin: new Date(),
          totalSessions: 1,
          pageViews: 10,
        },
      });

      analytics.activity.totalSessions = 2;
      analytics.activity.pageViews = 25;
      await analytics.save();

      const updated = await UserAnalytics.findById(analytics._id);
      expect(updated?.activity.totalSessions).toBe(2);
      expect(updated?.activity.pageViews).toBe(25);
    });

    it('should add search patterns to engagement', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({
        userId,
        engagement: {
          searchPatterns: [
            {
              query: 'coworking spaces',
              timestamp: new Date(),
              resultsCount: 15,
            },
          ],
        },
      });

      const retrieved = await UserAnalytics.findById(analytics._id);
      expect(retrieved?.engagement.searchPatterns).toHaveLength(1);
      expect(retrieved?.engagement.searchPatterns[0].query).toBe('coworking spaces');
    });

    it('should track view history', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({
        userId,
        engagement: {
          viewHistory: [
            {
              listingId: 'listing-123',
              viewedAt: new Date(),
              timeSpent: 120,
            },
            {
              listingId: 'listing-456',
              viewedAt: new Date(),
              timeSpent: 90,
            },
          ],
        },
      });

      const retrieved = await UserAnalytics.findById(analytics._id);
      expect(retrieved?.engagement.viewHistory).toHaveLength(2);
      expect(retrieved?.engagement.viewHistory[0].listingId).toBe('listing-123');
      expect(retrieved?.engagement.viewHistory[0].timeSpent).toBe(120);
    });

    it('should track preferred cities', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({
        userId,
        engagement: {
          preferredCities: ['Bangkok', 'Chiang Mai', 'Bali'],
        },
      });

      const retrieved = await UserAnalytics.findById(analytics._id);
      expect(retrieved?.engagement.preferredCities).toEqual(['Bangkok', 'Chiang Mai', 'Bali']);
    });

    it('should track conversion metrics', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({
        userId,
        conversions: {
          clickedExternalLinks: 5,
          completedContactForms: 2,
          premiumListingsViewed: 10,
          mapInteractions: 15,
        },
      });

      const retrieved = await UserAnalytics.findById(analytics._id);
      expect(retrieved?.conversions.clickedExternalLinks).toBe(5);
      expect(retrieved?.conversions.completedContactForms).toBe(2);
      expect(retrieved?.conversions.premiumListingsViewed).toBe(10);
      expect(retrieved?.conversions.mapInteractions).toBe(15);
    });

    it('should track user preferences', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({
        userId,
        preferences: {
          topAmenities: ['WiFi', 'Coffee', 'Meeting Rooms'],
          priceRangeUsage: [
            { min: 10, max: 50, frequency: 5 },
            { min: 50, max: 100, frequency: 3 },
          ],
        },
      });

      const retrieved = await UserAnalytics.findById(analytics._id);
      expect(retrieved?.preferences.topAmenities).toEqual(['WiFi', 'Coffee', 'Meeting Rooms']);
      expect(retrieved?.preferences.priceRangeUsage).toHaveLength(2);
      expect(retrieved?.preferences.priceRangeUsage[0].min).toBe(10);
      expect(retrieved?.preferences.priceRangeUsage[0].max).toBe(50);
    });

    it('should enforce array limits on save (searchPatterns)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = new UserAnalytics({
        userId,
        engagement: {
          searchPatterns: Array.from({ length: 150 }, (_, i) => ({
            query: `query-${i}`,
            timestamp: new Date(Date.now() - i * 1000),
            resultsCount: i,
          })),
        },
      });

      await analytics.save();

      const retrieved = await UserAnalytics.findById(analytics._id);
      expect(retrieved?.engagement.searchPatterns.length).toBeLessThanOrEqual(100);
    });

    it('should enforce array limits on save (viewHistory)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = new UserAnalytics({
        userId,
        engagement: {
          viewHistory: Array.from({ length: 600 }, (_, i) => ({
            listingId: `listing-${i}`,
            viewedAt: new Date(Date.now() - i * 1000),
            timeSpent: i,
          })),
        },
      });

      await analytics.save();

      const retrieved = await UserAnalytics.findById(analytics._id);
      expect(retrieved?.engagement.viewHistory.length).toBeLessThanOrEqual(500);
    });

    it('should increment conversion counters', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({
        userId,
        conversions: {
          clickedExternalLinks: 0,
        },
      });

      analytics.conversions.clickedExternalLinks += 1;
      await analytics.save();

      const retrieved = await UserAnalytics.findById(analytics._id);
      expect(retrieved?.conversions.clickedExternalLinks).toBe(1);
    });

    it('should delete UserAnalytics document', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({ userId });

      await UserAnalytics.findByIdAndDelete(analytics._id);

      const deleted = await UserAnalytics.findById(analytics._id);
      expect(deleted).toBeNull();
    });

    it('should count total UserAnalytics documents', async () => {
      await UserAnalytics.create([
        { userId: new mongoose.Types.ObjectId() },
        { userId: new mongoose.Types.ObjectId() },
        { userId: new mongoose.Types.ObjectId() },
      ]);

      const count = await UserAnalytics.countDocuments();
      expect(count).toBe(3);
    });

    it('should query by lastLogin date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      await UserAnalytics.create([
        {
          userId: new mongoose.Types.ObjectId(),
          activity: { lastLogin: now },
        },
        {
          userId: new mongoose.Types.ObjectId(),
          activity: { lastLogin: yesterday },
        },
        {
          userId: new mongoose.Types.ObjectId(),
          activity: { lastLogin: twoDaysAgo },
        },
      ]);

      const recentUsers = await UserAnalytics.find({
        'activity.lastLogin': { $gte: yesterday },
      });

      expect(recentUsers).toHaveLength(2);
    });

    it('should update timestamps automatically', async () => {
      const userId = new mongoose.Types.ObjectId();
      const analytics = await UserAnalytics.create({ userId });

      const originalUpdatedAt = analytics.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10));

      analytics.activity.totalSessions += 1;
      await analytics.save();

      const updated = await UserAnalytics.findById(analytics._id);
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
