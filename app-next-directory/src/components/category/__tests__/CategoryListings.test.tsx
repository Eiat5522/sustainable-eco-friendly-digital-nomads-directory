import { render, screen } from '@testing-library/react';
import { CategoryListings } from '../CategoryListings';

// Mock sanity client
jest.mock('@/lib/sanity/client', () => ({
  sanityFetch: jest.fn(),
}));

// Import the mocked function
import { sanityFetch } from '@/lib/sanity/client';
const mockSanityFetch = sanityFetch as jest.MockedFunction<typeof sanityFetch>;

describe('CategoryListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders listings count', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels', 'Vegan Cafes']) // categories query
        .mockResolvedValueOnce([
          {
            _id: '1',
            name: 'Eco Hotel Bangkok',
            slug: 'eco-hotel-bangkok',
            primaryImage: null,
          },
        ]); // listings query

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      expect(screen.getByText('Listings found: 1')).toBeInTheDocument();
    });

    it('renders list of listings', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([
          {
            _id: '1',
            name: 'Eco Hotel Bangkok',
            slug: 'eco-hotel-bangkok',
            primaryImage: null,
          },
          {
            _id: '2',
            name: 'Green Cafe',
            slug: 'green-cafe',
            primaryImage: null,
          },
        ]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
      expect(screen.getByText('Green Cafe')).toBeInTheDocument();
    });

    it('renders empty state when no listings found', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      expect(screen.getByText('Listings found: 0')).toBeInTheDocument();
      const list = screen.getByRole('list');
      expect(list).toBeEmptyDOMElement();
    });
  });

  describe('Slug Resolution', () => {
    it('resolves slug to original category value', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels', 'Vegan Cafes'])
        .mockResolvedValueOnce([
          {
            _id: '1',
            name: 'Test Listing',
            slug: 'test-listing',
            primaryImage: null,
          },
        ]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      // Should have called sanityFetch with the original category value
      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { category: 'Eco Hotels' },
        })
      );
    });

    it('uses slug directly when category resolution fails', async () => {
      mockSanityFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([]);

      const component = await CategoryListings({ slug: 'unknown-category' });
      render(component);

      // Should have called with the slug itself as fallback
      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { category: 'unknown-category' },
        })
      );
    });

    it('matches category case-insensitively via slugification', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels', 'VEGAN CAFES'])
        .mockResolvedValueOnce([]);

      const component = await CategoryListings({ slug: 'vegan-cafes' });
      render(component);

      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { category: 'VEGAN CAFES' },
        })
      );
    });
  });

  describe('Category Lookup Query', () => {
    it('fetches unique categories from Sanity', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Category 1', 'Category 2'])
        .mockResolvedValueOnce([]);

      await CategoryListings({ slug: 'test-slug' });

      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('array::unique'),
          revalidate: 60 * 60 * 24 * 7, // 7 days
          tags: ['categories:list'],
        })
      );
    });

    it('handles categories lookup error gracefully', async () => {
      mockSanityFetch
        .mockRejectedValueOnce(new Error('Sanity error'))
        .mockResolvedValueOnce([]);

      const component = await CategoryListings({ slug: 'test-slug' });
      render(component);

      // Should still render, even with failed category lookup
      expect(screen.getByText('Listings found: 0')).toBeInTheDocument();
    });
  });

  describe('Listings Query', () => {
    it('queries listings by category', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([]);

      await CategoryListings({ slug: 'eco-hotels' });

      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('_type == "listing"'),
          query: expect.stringContaining('category == $category'),
          query: expect.stringContaining('moderation.status == "published"'),
          params: { category: 'Eco Hotels' },
        })
      );
    });

    it('includes correct revalidation and tags', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([]);

      await CategoryListings({ slug: 'eco-hotels' });

      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          revalidate: 60 * 60 * 24 * 7, // 7 days
          tags: ['category:eco-hotels'],
        })
      );
    });

    it('handles listings query error gracefully', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockRejectedValueOnce(new Error('Query failed'));

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      // Should render empty state without throwing
      expect(screen.getByText('Listings found: 0')).toBeInTheDocument();
    });

    it('handles null response from listings query', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce(null);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      expect(screen.getByText('Listings found: 0')).toBeInTheDocument();
    });
  });

  describe('Listing Rendering', () => {
    it('renders listings with correct structure', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([
          {
            _id: '1',
            name: 'Eco Hotel',
            slug: 'eco-hotel',
            primaryImage: null,
          },
        ]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      const { container } = render(component);

      const listItems = container.querySelectorAll('li');
      expect(listItems).toHaveLength(1);
      expect(listItems[0]).toHaveClass('p-3');
      expect(listItems[0]).toHaveClass('border');
      expect(listItems[0]).toHaveClass('rounded');
    });

    it('uses listing _id as key', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([
          {
            _id: 'unique-id-1',
            name: 'Listing 1',
            slug: 'listing-1',
            primaryImage: null,
          },
          {
            _id: 'unique-id-2',
            name: 'Listing 2',
            slug: 'listing-2',
            primaryImage: null,
          },
        ]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      // React uses keys internally, verify both listings rendered
      expect(screen.getByText('Listing 1')).toBeInTheDocument();
      expect(screen.getByText('Listing 2')).toBeInTheDocument();
    });

    it('renders listing names', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([
          {
            _id: '1',
            name: 'Sustainable Workspace',
            slug: 'sustainable-workspace',
            primaryImage: null,
          },
        ]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      expect(screen.getByText('Sustainable Workspace')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies spacing to listing container', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([
          {
            _id: '1',
            name: 'Test',
            slug: 'test',
            primaryImage: null,
          },
        ]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      const { container } = render(component);

      const list = container.querySelector('ul');
      expect(list).toHaveClass('space-y-3');
    });

    it('applies margin to count paragraph', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      const { container } = render(component);

      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('mb-6');
    });
  });

  describe('Edge Cases', () => {
    it('handles slug with special characters', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco & Sustainable'])
        .mockResolvedValueOnce([]);

      const component = await CategoryListings({ slug: 'eco-sustainable' });
      render(component);

      expect(screen.getByText('Listings found: 0')).toBeInTheDocument();
    });

    it('handles empty categories list', async () => {
      mockSanityFetch
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const component = await CategoryListings({ slug: 'test-slug' });
      render(component);

      expect(screen.getByText('Listings found: 0')).toBeInTheDocument();
    });

    it('handles listings with missing fields', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([
          {
            _id: '1',
            name: 'Minimal Listing',
            slug: null,
            primaryImage: undefined,
          },
        ]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      expect(screen.getByText('Minimal Listing')).toBeInTheDocument();
    });

    it('handles large number of listings', async () => {
      const manyListings = Array.from({ length: 100 }, (_, i) => ({
        _id: `listing-${i}`,
        name: `Listing ${i}`,
        slug: `listing-${i}`,
        primaryImage: null,
      }));

      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce(manyListings);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      expect(screen.getByText('Listings found: 100')).toBeInTheDocument();
    });

    it('handles listing names with special characters', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([
          {
            _id: '1',
            name: 'Café & Restaurant "The Green" <Eco>',
            slug: 'cafe-restaurant',
            primaryImage: null,
          },
        ]);

      const component = await CategoryListings({ slug: 'eco-hotels' });
      render(component);

      expect(screen.getByText('Café & Restaurant "The Green" <Eco>')).toBeInTheDocument();
    });
  });

  describe('Server Component Behavior', () => {
    it('is an async server component', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([]);

      // Should be able to await the component
      const component = await CategoryListings({ slug: 'test-slug' });
      expect(component).toBeDefined();
      expect(typeof component).toBe('object');
    });

    it('can be called multiple times', async () => {
      mockSanityFetch
        .mockResolvedValueOnce(['Eco Hotels'])
        .mockResolvedValueOnce([]);

      const component1 = await CategoryListings({ slug: 'slug-1' });
      render(component1);

      mockSanityFetch
        .mockResolvedValueOnce(['Vegan Cafes'])
        .mockResolvedValueOnce([]);

      const component2 = await CategoryListings({ slug: 'slug-2' });
      render(component2);

      // Both should have been called
      expect(mockSanityFetch).toHaveBeenCalledTimes(4);
    });
  });
});
