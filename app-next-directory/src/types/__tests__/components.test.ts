import type {
  BadgeProps,
  ButtonProps,
  FilterCondition,
  FilterGroup,
  FilterOperator,
  FilterValues,
} from '../components';

describe('components types', () => {
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
    it('should accept string value condition', () => {
      const condition: FilterCondition = {
        field: 'category',
        value: 'coworking',
      };
      expect(condition.field).toBe('category');
      expect(condition.value).toBe('coworking');
    });

    it('should accept number value condition', () => {
      const condition: FilterCondition = {
        field: 'maxPrice',
        value: 1000,
      };
      expect(typeof condition.value).toBe('number');
      expect(condition.value).toBe(1000);
    });

    it('should accept boolean value condition', () => {
      const condition: FilterCondition = {
        field: 'hasWifi',
        value: true,
      };
      expect(typeof condition.value).toBe('boolean');
      expect(condition.value).toBe(true);
    });

    it('should accept condition with operator', () => {
      const condition: FilterCondition = {
        field: 'location',
        value: 'Bangkok',
        operator: 'AND',
      };
      expect(condition.operator).toBe('AND');
    });

    it('should accept condition without operator', () => {
      const condition: FilterCondition = {
        field: 'type',
        value: 'cafe',
      };
      expect(condition.operator).toBeUndefined();
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
          { field: 'hasWifi', value: true },
        ],
        operator: 'AND',
      };
      expect(group.conditions).toHaveLength(3);
    });

    it('should accept empty conditions array', () => {
      const group: FilterGroup = {
        conditions: [],
        operator: 'OR',
      };
      expect(group.conditions).toHaveLength(0);
    });

    it('should accept optional isEnabled', () => {
      const group: FilterGroup = {
        conditions: [],
        operator: 'AND',
        isEnabled: true,
      };
      expect(group.isEnabled).toBe(true);
    });

    it('should accept optional label', () => {
      const group: FilterGroup = {
        conditions: [],
        operator: 'OR',
        label: 'Price Filters',
      };
      expect(group.label).toBe('Price Filters');
    });

    it('should accept all optional properties', () => {
      const group: FilterGroup = {
        conditions: [{ field: 'test', value: 'value' }],
        operator: 'AND',
        isEnabled: false,
        label: 'Test Group',
      };
      expect(group.isEnabled).toBe(false);
      expect(group.label).toBe('Test Group');
    });
  });

  describe('FilterValues interface', () => {
    it('should accept empty filter values', () => {
      const values: FilterValues = {};
      expect(Object.keys(values)).toHaveLength(0);
    });

    it('should accept searchQuery', () => {
      const values: FilterValues = {
        searchQuery: 'eco cafe',
      };
      expect(values.searchQuery).toBe('eco cafe');
    });

    it('should accept category', () => {
      const values: FilterValues = {
        category: 'coworking',
      };
      expect(values.category).toBe('coworking');
    });

    it('should accept location', () => {
      const values: FilterValues = {
        location: 'Chiang Mai',
      };
      expect(values.location).toBe('Chiang Mai');
    });

    it('should accept ecoTags array', () => {
      const values: FilterValues = {
        ecoTags: ['solar-power', 'recycling', 'organic'],
      };
      expect(values.ecoTags).toHaveLength(3);
      expect(values.ecoTags).toContain('organic');
    });

    it('should accept nomadFeatures array', () => {
      const values: FilterValues = {
        nomadFeatures: ['wifi', 'meeting-rooms', 'quiet'],
      };
      expect(values.nomadFeatures).toHaveLength(3);
    });

    it('should accept minRating', () => {
      const values: FilterValues = {
        minRating: 4,
      };
      expect(values.minRating).toBe(4);
    });

    it('should accept maxPriceRange', () => {
      const values: FilterValues = {
        maxPriceRange: 1000,
      };
      expect(values.maxPriceRange).toBe(1000);
    });

    it('should accept combinations', () => {
      const values: FilterValues = {
        combinations: [
          {
            conditions: [{ field: 'category', value: 'cafe' }],
            operator: 'AND',
          },
        ],
      };
      expect(values.combinations).toHaveLength(1);
    });

    it('should accept combinationOperator', () => {
      const values: FilterValues = {
        combinationOperator: 'OR',
      };
      expect(values.combinationOperator).toBe('OR');
    });

    it('should accept all properties together', () => {
      const values: FilterValues = {
        searchQuery: 'workspace',
        category: 'coworking',
        location: 'Bangkok',
        ecoTags: ['solar'],
        nomadFeatures: ['wifi'],
        minRating: 3,
        maxPriceRange: 500,
        combinations: [],
        combinationOperator: 'AND',
      };
      expect(values.searchQuery).toBe('workspace');
      expect(values.minRating).toBe(3);
    });
  });

  describe('BadgeProps interface', () => {
    it('should accept default variant', () => {
      const props: BadgeProps = {
        variant: 'default',
      };
      expect(props.variant).toBe('default');
    });

    it('should accept all variant types', () => {
      const variants: BadgeProps['variant'][] = ['default', 'secondary', 'destructive', 'outline'];
      variants.forEach(variant => {
        const props: BadgeProps = { variant };
        expect(props.variant).toBe(variant);
      });
    });

    it('should extend React.HTMLAttributes', () => {
      const props: BadgeProps = {
        className: 'custom-badge',
        id: 'badge-1',
        'data-testid': 'test-badge',
      };
      expect(props.className).toBe('custom-badge');
      expect(props.id).toBe('badge-1');
      expect(props['data-testid']).toBe('test-badge');
    });

    it('should accept onClick handler', () => {
      const onClick = jest.fn();
      const props: BadgeProps = {
        onClick,
      };
      expect(props.onClick).toBe(onClick);
    });

    it('should accept all props together', () => {
      const props: BadgeProps = {
        variant: 'secondary',
        className: 'my-badge',
        onClick: jest.fn(),
        title: 'Badge title',
      };
      expect(props.variant).toBe('secondary');
      expect(props.className).toBe('my-badge');
    });
  });

  describe('ButtonProps interface', () => {
    it('should accept default variant', () => {
      const props: ButtonProps = {
        variant: 'default',
      };
      expect(props.variant).toBe('default');
    });

    it('should accept all variant types', () => {
      const variants: ButtonProps['variant'][] = ['default', 'outline', 'ghost', 'link'];
      variants.forEach(variant => {
        const props: ButtonProps = { variant };
        expect(props.variant).toBe(variant);
      });
    });

    it('should accept all size types', () => {
      const sizes: ButtonProps['size'][] = ['default', 'sm', 'lg', 'icon'];
      sizes.forEach(size => {
        const props: ButtonProps = { size };
        expect(props.size).toBe(size);
      });
    });

    it('should accept asChild prop', () => {
      const props: ButtonProps = {
        asChild: true,
      };
      expect(props.asChild).toBe(true);
    });

    it('should extend React.ButtonHTMLAttributes', () => {
      const props: ButtonProps = {
        type: 'submit',
        disabled: true,
        className: 'custom-button',
        'aria-label': 'Submit button',
      };
      expect(props.type).toBe('submit');
      expect(props.disabled).toBe(true);
      expect(props.className).toBe('custom-button');
    });

    it('should accept onClick handler', () => {
      const onClick = jest.fn();
      const props: ButtonProps = {
        onClick,
      };
      expect(props.onClick).toBe(onClick);
    });

    it('should accept all props together', () => {
      const props: ButtonProps = {
        variant: 'outline',
        size: 'lg',
        asChild: false,
        type: 'button',
        disabled: false,
        className: 'my-button',
      };
      expect(props.variant).toBe('outline');
      expect(props.size).toBe('lg');
      expect(props.asChild).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should support filter building workflow', () => {
      const values: FilterValues = {};

      values.searchQuery = 'eco workspace';
      values.category = 'coworking';
      values.ecoTags = ['solar-power'];

      expect(values.searchQuery).toBeDefined();
      expect(values.category).toBe('coworking');
    });

    it('should support complex filter groups', () => {
      const values: FilterValues = {
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
              { field: 'hasWifi', value: true },
            ],
            operator: 'AND',
            isEnabled: true,
            label: 'WiFi Cafes',
          },
        ],
        combinationOperator: 'OR',
      };

      expect(values.combinations).toHaveLength(2);
      expect(values.combinationOperator).toBe('OR');
    });

    it('should support UI component prop patterns', () => {
      const button: ButtonProps = {
        variant: 'default',
        size: 'lg',
        type: 'submit',
      };

      const badge: BadgeProps = {
        variant: 'secondary',
        className: 'status-badge',
      };

      expect(button.variant).toBe('default');
      expect(badge.variant).toBe('secondary');
    });

    it('should handle conditional filter application', () => {
      const baseValues: FilterValues = {
        searchQuery: 'workspace',
      };

      const withLocation: FilterValues = {
        ...baseValues,
        location: 'Bangkok',
      };

      const withRating: FilterValues = {
        ...withLocation,
        minRating: 4,
      };

      expect(withRating.searchQuery).toBe('workspace');
      expect(withRating.location).toBe('Bangkok');
      expect(withRating.minRating).toBe(4);
    });

    it('should support array filtering operations', () => {
      const groups: FilterGroup[] = [
        {
          conditions: [{ field: 'a', value: 'test' }],
          operator: 'AND',
          isEnabled: true,
        },
        {
          conditions: [{ field: 'b', value: 'test' }],
          operator: 'OR',
          isEnabled: false,
        },
      ];

      const enabled = groups.filter(g => g.isEnabled);
      expect(enabled).toHaveLength(1);
    });
  });
});
