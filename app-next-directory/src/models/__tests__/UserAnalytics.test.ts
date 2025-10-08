import mongoose from 'mongoose';
import UserAnalytics from '../UserAnalytics';

describe('UserAnalytics model schema', () => {
  const schema = UserAnalytics.schema as any;

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
});
