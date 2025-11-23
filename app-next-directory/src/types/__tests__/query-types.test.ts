import type {
  ListingStats,
  NearbyVenue,
  SearchResult,
  VenueSummary,
  WorkspaceResult,
} from '../query-types';

describe('query-types types', () => {
  describe('ListingStats interface', () => {
    it('should accept valid listing stats', () => {
      const stats: ListingStats = {
        totalListings: 100,
        byCategory: [
          { category: 'coworking', count: 40 },
          { category: 'cafe', count: 35 },
          { category: 'accommodation', count: 25 },
        ],
        topCities: [
          { city: 'Bangkok', country: 'Thailand', count: 45 },
          { city: 'Chiang Mai', country: 'Thailand', count: 30 },
        ],
        averageRatings: [
          { listing: 'listing-1', avgRating: 4.5 },
          { listing: 'listing-2', avgRating: 4.8 },
        ],
      };
      expect(stats.totalListings).toBe(100);
      expect(stats.byCategory).toHaveLength(3);
    });

    it('should accept empty arrays', () => {
      const stats: ListingStats = {
        totalListings: 0,
        byCategory: [],
        topCities: [],
        averageRatings: [],
      };
      expect(stats.totalListings).toBe(0);
      expect(stats.byCategory).toHaveLength(0);
    });

    it('should handle category distribution', () => {
      const stats: ListingStats = {
        totalListings: 50,
        byCategory: [
          { category: 'coworking', count: 20 },
          { category: 'cafe', count: 15 },
          { category: 'accommodation', count: 10 },
          { category: 'restaurant', count: 5 },
        ],
        topCities: [],
        averageRatings: [],
      };
      const totalByCategory = stats.byCategory.reduce((sum, cat) => sum + cat.count, 0);
      expect(totalByCategory).toBe(50);
    });

    it('should handle city rankings', () => {
      const stats: ListingStats = {
        totalListings: 100,
        byCategory: [],
        topCities: [
          { city: 'Bangkok', country: 'Thailand', count: 50 },
          { city: 'Lisbon', country: 'Portugal', count: 25 },
          { city: 'Berlin', country: 'Germany', count: 15 },
        ],
        averageRatings: [],
      };
      expect(stats.topCities[0].count).toBeGreaterThan(stats.topCities[1].count);
    });
  });

  describe('WorkspaceResult interface', () => {
    it('should accept valid cafe workspace', () => {
      const workspace: WorkspaceResult = {
        _id: 'cafe-123',
        name: 'Coffee Workspace',
        type: 'cafe',
        wifiSpeed: 50,
        hasWorkspaces: true,
        powerOutlets: 'abundant',
        location: {
          city: 'Bangkok',
          coordinates: {
            lat: 13.7563,
            lng: 100.5018,
          },
        },
      };
      expect(workspace.type).toBe('cafe');
      expect(workspace.wifiSpeed).toBe(50);
    });

    it('should accept valid coworking workspace', () => {
      const workspace: WorkspaceResult = {
        _id: 'cowork-456',
        name: 'Coworking Hub',
        type: 'coworking',
        wifiSpeed: 100,
        hasWorkspaces: true,
        powerOutlets: 'every desk',
        location: {
          city: 'Chiang Mai',
          coordinates: {
            lat: 18.7883,
            lng: 98.9853,
          },
        },
      };
      expect(workspace.type).toBe('coworking');
      expect(workspace.hasWorkspaces).toBe(true);
    });

    it('should handle different wifi speeds', () => {
      const slow: WorkspaceResult = {
        _id: '1',
        name: 'Slow Cafe',
        type: 'cafe',
        wifiSpeed: 10,
        hasWorkspaces: true,
        powerOutlets: 'limited',
        location: { city: 'Test', coordinates: { lat: 0, lng: 0 } },
      };

      const fast: WorkspaceResult = {
        _id: '2',
        name: 'Fast Coworking',
        type: 'coworking',
        wifiSpeed: 500,
        hasWorkspaces: true,
        powerOutlets: 'abundant',
        location: { city: 'Test', coordinates: { lat: 0, lng: 0 } },
      };

      expect(fast.wifiSpeed).toBeGreaterThan(slow.wifiSpeed);
    });
  });

  describe('SearchResult interface', () => {
    it('should accept valid search result', () => {
      const result: SearchResult = {
        _id: 'search-123',
        name: 'Eco Workspace',
        score: 0.95,
        type: 'coworking',
        description: 'Sustainable coworking space',
        city: 'Bangkok',
      };
      expect(result._id).toBe('search-123');
      expect(result.score).toBe(0.95);
    });

    it('should accept result with primary image', () => {
      const result: SearchResult = {
        _id: 'result-1',
        name: 'Test Venue',
        score: 0.8,
        type: 'cafe',
        description: 'Test description',
        city: 'Test City',
        primaryImage: {
          asset: {
            url: 'https://example.com/image.jpg',
          },
        },
      };
      expect(result.primaryImage?.asset.url).toBe('https://example.com/image.jpg');
    });

    it('should accept result without primary image', () => {
      const result: SearchResult = {
        _id: 'result-2',
        name: 'Test Venue',
        score: 0.7,
        type: 'accommodation',
        description: 'Test description',
        city: 'Test City',
      };
      expect(result.primaryImage).toBeUndefined();
    });

    it('should handle different score values', () => {
      const results: SearchResult[] = [
        {
          _id: '1',
          name: 'High Score',
          score: 0.99,
          type: 'coworking',
          description: 'Best match',
          city: 'Bangkok',
        },
        {
          _id: '2',
          name: 'Low Score',
          score: 0.3,
          type: 'cafe',
          description: 'Weak match',
          city: 'Bangkok',
        },
      ];

      expect(results[0].score).toBeGreaterThan(results[1].score);
    });
  });

  describe('NearbyVenue interface', () => {
    it('should accept valid nearby venue', () => {
      const venue: NearbyVenue = {
        _id: 'venue-123',
        name: 'Nearby Cafe',
        distance: 0.5,
        location: {
          coordinates: {
            lat: 13.7563,
            lng: 100.5018,
          },
        },
        type: 'cafe',
        city: 'Bangkok',
      };
      expect(venue.distance).toBe(0.5);
      expect(venue.type).toBe('cafe');
    });

    it('should handle different distances', () => {
      const venues: NearbyVenue[] = [
        {
          _id: '1',
          name: 'Close',
          distance: 0.1,
          location: { coordinates: { lat: 0, lng: 0 } },
          type: 'coworking',
          city: 'Bangkok',
        },
        {
          _id: '2',
          name: 'Far',
          distance: 5.0,
          location: { coordinates: { lat: 0, lng: 0 } },
          type: 'cafe',
          city: 'Bangkok',
        },
      ];

      expect(venues[0].distance).toBeLessThan(venues[1].distance);
    });

    it('should handle different venue types', () => {
      const types = ['coworking', 'cafe', 'accommodation', 'restaurant'];
      types.forEach(type => {
        const venue: NearbyVenue = {
          _id: `venue-${type}`,
          name: `Test ${type}`,
          distance: 1.0,
          location: { coordinates: { lat: 0, lng: 0 } },
          type,
          city: 'Test City',
        };
        expect(venue.type).toBe(type);
      });
    });
  });

  describe('VenueSummary interface', () => {
    it('should accept complete venue summary', () => {
      const summary: VenueSummary = {
        coworkingSpaces: {
          total: 50,
          withHighSpeedWifi: 45,
          with24Access: 30,
          priceDistribution: [
            { range: 'budget', count: 15 },
            { range: 'moderate', count: 25 },
            { range: 'premium', count: 10 },
          ],
        },
        cafes: {
          total: 40,
          laptopFriendly: 35,
          withGoodWifi: 30,
          withoutTimeLimits: 20,
        },
      };
      expect(summary.coworkingSpaces.total).toBe(50);
      expect(summary.cafes.total).toBe(40);
    });

    it('should handle coworking space statistics', () => {
      const summary: VenueSummary = {
        coworkingSpaces: {
          total: 100,
          withHighSpeedWifi: 80,
          with24Access: 60,
          priceDistribution: [
            { range: 'budget', count: 30 },
            { range: 'moderate', count: 50 },
            { range: 'premium', count: 20 },
          ],
        },
        cafes: {
          total: 0,
          laptopFriendly: 0,
          withGoodWifi: 0,
          withoutTimeLimits: 0,
        },
      };

      const totalPrice = summary.coworkingSpaces.priceDistribution.reduce(
        (sum, dist) => sum + dist.count,
        0
      );
      expect(totalPrice).toBe(100);
    });

    it('should handle cafe statistics', () => {
      const summary: VenueSummary = {
        coworkingSpaces: {
          total: 0,
          withHighSpeedWifi: 0,
          with24Access: 0,
          priceDistribution: [],
        },
        cafes: {
          total: 50,
          laptopFriendly: 40,
          withGoodWifi: 35,
          withoutTimeLimits: 25,
        },
      };

      expect(summary.cafes.laptopFriendly).toBeLessThanOrEqual(summary.cafes.total);
      expect(summary.cafes.withGoodWifi).toBeLessThanOrEqual(summary.cafes.laptopFriendly);
    });

    it('should handle all price ranges', () => {
      const summary: VenueSummary = {
        coworkingSpaces: {
          total: 60,
          withHighSpeedWifi: 50,
          with24Access: 40,
          priceDistribution: [
            { range: 'budget', count: 20 },
            { range: 'moderate', count: 30 },
            { range: 'premium', count: 10 },
          ],
        },
        cafes: {
          total: 0,
          laptopFriendly: 0,
          withGoodWifi: 0,
          withoutTimeLimits: 0,
        },
      };

      const ranges = summary.coworkingSpaces.priceDistribution.map(d => d.range);
      expect(ranges).toContain('budget');
      expect(ranges).toContain('moderate');
      expect(ranges).toContain('premium');
    });
  });

  describe('Integration scenarios', () => {
    it('should support statistics aggregation', () => {
      const stats: ListingStats = {
        totalListings: 150,
        byCategory: [
          { category: 'coworking', count: 60 },
          { category: 'cafe', count: 50 },
          { category: 'accommodation', count: 30 },
          { category: 'restaurant', count: 10 },
        ],
        topCities: [{ city: 'Bangkok', country: 'Thailand', count: 70 }],
        averageRatings: [],
      };

      const summary: VenueSummary = {
        coworkingSpaces: {
          total: 60,
          withHighSpeedWifi: 50,
          with24Access: 40,
          priceDistribution: [],
        },
        cafes: {
          total: 50,
          laptopFriendly: 45,
          withGoodWifi: 40,
          withoutTimeLimits: 30,
        },
      };

      const coworkingCount = stats.byCategory.find(c => c.category === 'coworking')?.count;
      expect(coworkingCount).toBe(summary.coworkingSpaces.total);
    });

    it('should support search result sorting by score', () => {
      const results: SearchResult[] = [
        { _id: '1', name: 'A', score: 0.5, type: 'cafe', description: 'Test', city: 'Bangkok' },
        {
          _id: '2',
          name: 'B',
          score: 0.9,
          type: 'coworking',
          description: 'Test',
          city: 'Bangkok',
        },
        {
          _id: '3',
          name: 'C',
          score: 0.7,
          type: 'accommodation',
          description: 'Test',
          city: 'Bangkok',
        },
      ];

      const sorted = [...results].sort((a, b) => b.score - a.score);
      expect(sorted[0].score).toBe(0.9);
      expect(sorted[2].score).toBe(0.5);
    });

    it('should support nearby venue filtering by distance', () => {
      const venues: NearbyVenue[] = [
        {
          _id: '1',
          name: 'Near',
          distance: 0.3,
          location: { coordinates: { lat: 0, lng: 0 } },
          type: 'coworking',
          city: 'Bangkok',
        },
        {
          _id: '2',
          name: 'Far',
          distance: 3.0,
          location: { coordinates: { lat: 0, lng: 0 } },
          type: 'cafe',
          city: 'Bangkok',
        },
      ];

      const nearby = venues.filter(v => v.distance < 1.0);
      expect(nearby).toHaveLength(1);
      expect(nearby[0].name).toBe('Near');
    });
  });
});
