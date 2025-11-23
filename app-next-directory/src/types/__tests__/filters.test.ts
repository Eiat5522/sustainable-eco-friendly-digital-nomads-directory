import { ListingCategory } from '../enums';
import type {
  FilterCondition,
  FilterGroup,
  FilterOperator,
  FilterResults,
  ListingFilters,
} from '../filters';

describe('filters types', () => {
  describe('FilterOperator type', () => {
    it('should accept AND operator', () => {
      const operator: FilterOperator = 'AND';
      expect(operator).toBe('AND');
    });

    it('should accept OR operator', () => {
      const operator: FilterOperator = 'OR';
      expect(operator).toBe('OR');
    });
  });

  describe('FilterCondition interface', () => {
    it('should accept basic filter condition', () => {
      const condition: FilterCondition = {
        field: 'category',
        value: 'coworking',
      };
      expect(condition.field).toBe('category');
      expect(condition.value).toBe('coworking');
    });

    it('should accept condition with operator', () => {
      const condition: FilterCondition = {
        field: 'searchQuery',
        value: 'wifi',
        operator: 'AND',
      };
      expect(condition.operator).toBe('AND');
    });

    it('should accept condition with different value types', () => {
      const stringCondition: FilterCondition = {
        field: 'location',
        value: 'Bangkok',
      };
      const numberCondition: FilterCondition = {
        field: 'maxPriceRange',
        value: 1000,
      };
      const arrayCondition: FilterCondition = {
        field: 'ecoTags',
        value: ['solar', 'recycling'],
      };

      expect(typeof stringCondition.value).toBe('string');
      expect(typeof numberCondition.value).toBe('number');
      expect(Array.isArray(arrayCondition.value)).toBe(true);
    });
  });

  describe('FilterGroup interface', () => {
    it('should accept basic filter group', () => {
      const group: FilterGroup = {
        conditions: [{ field: 'category', value: 'coworking' }],
        operator: 'AND',
      };
      expect(group.conditions).toHaveLength(1);
      expect(group.operator).toBe('AND');
    });

    it('should accept group with multiple conditions', () => {
      const group: FilterGroup = {
        conditions: [
          { field: 'category', value: 'coworking' },
          { field: 'location', value: 'Bangkok' },
          { field: 'maxPriceRange', value: 500 },
        ],
        operator: 'AND',
      };
      expect(group.conditions).toHaveLength(3);
    });

    it('should accept optional isEnabled flag', () => {
      const group: FilterGroup = {
        conditions: [],
        operator: 'OR',
        isEnabled: true,
      };
      expect(group.isEnabled).toBe(true);
    });

    it('should accept optional label', () => {
      const group: FilterGroup = {
        conditions: [],
        operator: 'AND',
        label: 'Price Filters',
      };
      expect(group.label).toBe('Price Filters');
    });

    it('should accept all optional properties', () => {
      const group: FilterGroup = {
        conditions: [{ field: 'category', value: 'cafe' }],
        operator: 'OR',
        isEnabled: false,
        label: 'Cafe Filters',
      };
      expect(group.isEnabled).toBe(false);
      expect(group.label).toBe('Cafe Filters');
    });
  });

  describe('ListingFilters interface', () => {
    it('should accept empty filters', () => {
      const filters: ListingFilters = {};
      expect(Object.keys(filters)).toHaveLength(0);
    });

    it('should accept searchQuery filter', () => {
      const filters: ListingFilters = {
        searchQuery: 'coffee shop',
      };
      expect(filters.searchQuery).toBe('coffee shop');
    });

    it('should accept category filter with enum', () => {
      const filters: ListingFilters = {
        category: ListingCategory.COWORKING,
      };
      expect(filters.category).toBe('coworking');
    });

    it('should accept location filter', () => {
      const filters: ListingFilters = {
        location: 'Chiang Mai',
      };
      expect(filters.location).toBe('Chiang Mai');
    });

    it('should accept array filters', () => {
      const filters: ListingFilters = {
        ecoTags: ['solar-power', 'recycling'],
        nomadFeatures: ['wifi', 'quiet'],
      };
      expect(filters.ecoTags).toHaveLength(2);
      expect(filters.nomadFeatures).toHaveLength(2);
    });

    it('should accept price range filters', () => {
      const filters: ListingFilters = {
        minPriceRange: 100,
        maxPriceRange: 1000,
      };
      expect(filters.minPriceRange).toBe(100);
      expect(filters.maxPriceRange).toBe(1000);
    });

    it('should accept sustainability score filter', () => {
      const filters: ListingFilters = {
        sustainabilityScore: 4,
      };
      expect(filters.sustainabilityScore).toBe(4);
    });

    it('should accept geo-filtering parameters', () => {
      const filters: ListingFilters = {
        latitude: 13.7563,
        longitude: 100.5018,
        radius: 5,
      };
      expect(filters.latitude).toBe(13.7563);
      expect(filters.longitude).toBe(100.5018);
      expect(filters.radius).toBe(5);
    });

    it('should accept accommodation type filter', () => {
      const filters: ListingFilters = {
        accommodationType: ['hostel', 'hotel', 'apartment'],
      };
      expect(filters.accommodationType).toHaveLength(3);
    });

    it('should accept eco certification filter', () => {
      const filters: ListingFilters = {
        ecoCertification: 'Green Key',
      };
      expect(filters.ecoCertification).toBe('Green Key');
    });

    it('should accept filter combinations', () => {
      const filters: ListingFilters = {
        combinations: [
          {
            conditions: [{ field: 'category', value: 'coworking' }],
            operator: 'AND',
          },
        ],
      };
      expect(filters.combinations).toHaveLength(1);
    });

    it('should accept combination operator', () => {
      const filters: ListingFilters = {
        combinationOperator: 'OR',
      };
      expect(filters.combinationOperator).toBe('OR');
    });

    it('should accept all filters together', () => {
      const filters: ListingFilters = {
        searchQuery: 'eco cafe',
        category: ListingCategory.CAFE,
        location: 'Bangkok',
        ecoTags: ['organic', 'zero-waste'],
        nomadFeatures: ['wifi', 'power-outlets'],
        minPriceRange: 50,
        maxPriceRange: 500,
        sustainabilityScore: 5,
        radius: 10,
        latitude: 13.7563,
        longitude: 100.5018,
        accommodationType: ['hostel'],
        ecoCertification: 'LEED',
        combinations: [],
        combinationOperator: 'AND',
      };
      expect(filters.searchQuery).toBe('eco cafe');
      expect(filters.category).toBe('cafe');
      expect(filters.ecoTags).toContain('organic');
    });
  });

  describe('FilterResults interface', () => {
    it('should accept valid filter results', () => {
      const results: FilterResults<any> = {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
      expect(results.data).toHaveLength(0);
      expect(results.total).toBe(0);
    });

    it('should accept results with data', () => {
      const results: FilterResults<{ id: string; name: string }> = {
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };
      expect(results.data).toHaveLength(2);
      expect(results.total).toBe(2);
    });

    it('should work with different data types', () => {
      interface TestItem {
        id: string;
        value: number;
      }
      const results: FilterResults<TestItem> = {
        data: [{ id: 'test', value: 100 }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      expect(results.data[0].value).toBe(100);
    });

    it('should handle pagination correctly', () => {
      const results: FilterResults<string> = {
        data: ['a', 'b', 'c'],
        total: 10,
        page: 2,
        totalPages: 4,
      };
      expect(results.page).toBe(2);
      expect(results.totalPages).toBe(4);
      expect(results.data).toHaveLength(3);
    });
  });

  describe('Complex filter scenarios', () => {
    it('should support nested filter groups', () => {
      const filters: ListingFilters = {
        combinations: [
          {
            conditions: [
              { field: 'category', value: 'coworking' },
              { field: 'location', value: 'Bangkok' },
            ],
            operator: 'AND',
            isEnabled: true,
            label: 'Bangkok Coworking',
          },
          {
            conditions: [
              { field: 'category', value: 'cafe' },
              { field: 'ecoTags', value: ['organic'] },
            ],
            operator: 'AND',
            isEnabled: true,
            label: 'Organic Cafes',
          },
        ],
        combinationOperator: 'OR',
      };
      expect(filters.combinations).toHaveLength(2);
      expect(filters.combinationOperator).toBe('OR');
    });

    it('should support building filters incrementally', () => {
      const filters: ListingFilters = {};

      filters.searchQuery = 'workspace';
      filters.category = ListingCategory.COWORKING;
      filters.ecoTags = ['solar-power'];
      filters.maxPriceRange = 1000;

      expect(filters.searchQuery).toBeDefined();
      expect(filters.category).toBe('coworking');
      expect(filters.ecoTags).toContain('solar-power');
      expect(filters.maxPriceRange).toBe(1000);
    });

    it('should handle empty filter results', () => {
      const results: FilterResults<any> = {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
      expect(results.data).toHaveLength(0);
    });

    it('should handle large result sets', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        value: i,
      }));

      const results: FilterResults<{ id: string; value: number }> = {
        data: largeData,
        total: 1000,
        page: 5,
        totalPages: 10,
      };

      expect(results.data).toHaveLength(100);
      expect(results.total).toBe(1000);
    });
  });
});
