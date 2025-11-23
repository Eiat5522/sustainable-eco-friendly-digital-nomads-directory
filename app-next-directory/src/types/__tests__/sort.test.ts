import { DEFAULT_SORT_OPTIONS, type SortOption } from '../sort';

describe('sort types and constants', () => {
  describe('SortOption interface', () => {
    it('should accept valid sort option with asc direction', () => {
      const option: SortOption = {
        field: 'name',
        displayName: 'Name',
        direction: 'asc',
      };
      expect(option.field).toBe('name');
      expect(option.displayName).toBe('Name');
      expect(option.direction).toBe('asc');
    });

    it('should accept valid sort option with desc direction', () => {
      const option: SortOption = {
        field: 'rating',
        displayName: 'Rating',
        direction: 'desc',
      };
      expect(option.field).toBe('rating');
      expect(option.displayName).toBe('Rating');
      expect(option.direction).toBe('desc');
    });

    it('should allow different field values', () => {
      const options: SortOption[] = [
        { field: 'price', displayName: 'Price', direction: 'asc' },
        { field: 'date', displayName: 'Date', direction: 'desc' },
        { field: 'popularity', displayName: 'Popularity', direction: 'desc' },
      ];
      expect(options).toHaveLength(3);
      expect(options[0].field).toBe('price');
      expect(options[2].field).toBe('popularity');
    });
  });

  describe('DEFAULT_SORT_OPTIONS constant', () => {
    it('should be defined and be an array', () => {
      expect(DEFAULT_SORT_OPTIONS).toBeDefined();
      expect(Array.isArray(DEFAULT_SORT_OPTIONS)).toBe(true);
    });

    it('should have exactly 5 default options', () => {
      expect(DEFAULT_SORT_OPTIONS).toHaveLength(5);
    });

    it('should include name sort option', () => {
      const nameOption = DEFAULT_SORT_OPTIONS.find(opt => opt.field === 'name');
      expect(nameOption).toBeDefined();
      expect(nameOption?.displayName).toBe('Name');
      expect(nameOption?.direction).toBe('asc');
    });

    it('should include sustainabilityScore sort option', () => {
      const scoreOption = DEFAULT_SORT_OPTIONS.find(opt => opt.field === 'sustainabilityScore');
      expect(scoreOption).toBeDefined();
      expect(scoreOption?.displayName).toBe('Sustainability Score');
      expect(scoreOption?.direction).toBe('desc');
    });

    it('should include rating sort option', () => {
      const ratingOption = DEFAULT_SORT_OPTIONS.find(opt => opt.field === 'rating');
      expect(ratingOption).toBeDefined();
      expect(ratingOption?.displayName).toBe('Rating');
      expect(ratingOption?.direction).toBe('desc');
    });

    it('should include priceRange sort option', () => {
      const priceOption = DEFAULT_SORT_OPTIONS.find(opt => opt.field === 'priceRange');
      expect(priceOption).toBeDefined();
      expect(priceOption?.displayName).toBe('Price');
      expect(priceOption?.direction).toBe('asc');
    });

    it('should include _createdAt sort option', () => {
      const dateOption = DEFAULT_SORT_OPTIONS.find(opt => opt.field === '_createdAt');
      expect(dateOption).toBeDefined();
      expect(dateOption?.displayName).toBe('Newest');
      expect(dateOption?.direction).toBe('desc');
    });

    it('should have all valid sort directions', () => {
      DEFAULT_SORT_OPTIONS.forEach(option => {
        expect(['asc', 'desc']).toContain(option.direction);
      });
    });

    it('should have all fields as strings', () => {
      DEFAULT_SORT_OPTIONS.forEach(option => {
        expect(typeof option.field).toBe('string');
        expect(option.field.length).toBeGreaterThan(0);
      });
    });

    it('should have all display names as strings', () => {
      DEFAULT_SORT_OPTIONS.forEach(option => {
        expect(typeof option.displayName).toBe('string');
        expect(option.displayName.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Type usage patterns', () => {
    it('should work with array methods', () => {
      const fields = DEFAULT_SORT_OPTIONS.map(opt => opt.field);
      expect(fields).toContain('name');
      expect(fields).toContain('rating');
    });

    it('should allow filtering by direction', () => {
      const descOptions = DEFAULT_SORT_OPTIONS.filter(opt => opt.direction === 'desc');
      expect(descOptions.length).toBeGreaterThan(0);
      descOptions.forEach(opt => {
        expect(opt.direction).toBe('desc');
      });
    });

    it('should allow finding by field', () => {
      const priceSort = DEFAULT_SORT_OPTIONS.find(opt => opt.field === 'priceRange');
      expect(priceSort).toBeDefined();
      if (priceSort) {
        expect(priceSort.displayName).toBe('Price');
      }
    });

    it('should support custom sort options', () => {
      const customSort: SortOption = {
        field: 'distance',
        displayName: 'Distance',
        direction: 'asc',
      };
      const allOptions = [...DEFAULT_SORT_OPTIONS, customSort];
      expect(allOptions).toHaveLength(6);
      expect(allOptions[5].field).toBe('distance');
    });

    it('should allow creating sort option arrays', () => {
      const sortOptions: SortOption[] = [
        { field: 'name', displayName: 'Name A-Z', direction: 'asc' },
        { field: 'name', displayName: 'Name Z-A', direction: 'desc' },
      ];
      expect(sortOptions).toHaveLength(2);
      expect(sortOptions[0].direction).toBe('asc');
      expect(sortOptions[1].direction).toBe('desc');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle empty field strings in type system', () => {
      const option: SortOption = {
        field: '',
        displayName: 'Test',
        direction: 'asc',
      };
      expect(option.field).toBe('');
    });

    it('should handle special characters in field names', () => {
      const option: SortOption = {
        field: '_createdAt',
        displayName: 'Created At',
        direction: 'desc',
      };
      expect(option.field).toBe('_createdAt');
    });

    it('should maintain immutability of DEFAULT_SORT_OPTIONS reference', () => {
      const original = DEFAULT_SORT_OPTIONS;
      const copy = [...DEFAULT_SORT_OPTIONS];
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
    });
  });
});
