import { describe, expect, it } from '@jest/globals';

import {
  type FavoriteEntry,
  formatDate,
  normaliseFavorite,
  normaliseOwnerReviews,
  type OwnerReviewsResponse,
} from '../utils';

describe('app/profile/utils', () => {
  describe('normaliseFavorite', () => {
    it('returns null when entry is missing or slug is empty', () => {
      expect(normaliseFavorite(null)).toBeNull();
      expect(normaliseFavorite(undefined)).toBeNull();

      const withoutSlug: FavoriteEntry = {
        _id: 'fav-1',
        listing: { name: 'Eco Hub', slug: '   ' },
      };

      expect(normaliseFavorite(withoutSlug)).toBeNull();
    });

    it('normalises listing information and trims values', () => {
      const entry: FavoriteEntry = {
        _id: 'fav-123',
        createdAt: '2024-03-05T00:00:00.000Z',
        listing: {
          slug: ' eco-haven ',
          name: '  Eco Haven  ',
          city: { name: '  Lisbon ', country: ' Portugal ' },
          type: 'coworking',
          priceRange: 'moderate',
          shortDescription: '  Sustainable workspace ',
          ecoFocusTags: [{ name: ' Solar ' }, '  Recycling  '],
          digitalNomadFeatures: [{ name: ' Fast WiFi ' }, '  Phone booths '],
          primaryImage: {
            asset: {
              url: ' https://cdn.test/image.jpg ',
              metadata: { dimensions: { width: 1200, height: 900 } },
            },
            altText: '  Workspace view  ',
          },
        },
      };

      expect(normaliseFavorite(entry)).toEqual({
        id: 'fav-123',
        name: 'Eco Haven',
        slug: 'eco-haven',
        city: 'Lisbon',
        country: 'Portugal',
        type: 'coworking',
        category: undefined,
        shortDescription: 'Sustainable workspace',
        priceRange: 'moderate',
        ecoFocusTags: ['Solar', 'Recycling'],
        digitalNomadFeatures: ['Fast WiFi', 'Phone booths'],
        imageUrl: 'https://cdn.test/image.jpg',
        image: {
          url: 'https://cdn.test/image.jpg',
          width: 1200,
          height: 900,
          alt: 'Workspace view',
        },
        createdAt: '2024-03-05T00:00:00.000Z',
      });
    });

    it('falls back when optional data is unavailable or invalid', () => {
      const entry: FavoriteEntry = {
        _id: '  ',
        listing: {
          slug: 'forest-retreat',
          name: null,
          priceRange: 'luxury',
          ecoFocusTags: null,
          digitalNomadFeatures: [null, { name: '' }, ''],
          primaryImage: {
            asset: {
              url: '',
            },
          },
        },
      };

      expect(normaliseFavorite(entry)).toEqual({
        id: 'forest-retreat',
        name: 'Untitled listing',
        slug: 'forest-retreat',
        city: undefined,
        country: undefined,
        type: undefined,
        category: undefined,
        shortDescription: undefined,
        priceRange: undefined,
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        image: undefined,
        imageUrl: undefined,
        createdAt: undefined,
      });
    });

    it('supports alternative image fields and default dimensions', () => {
      const entry: FavoriteEntry = {
        listing: {
          slug: 'eco-lodge',
          mainImage: {
            asset: {
              url: 'https://cdn.test/alt.jpg',
              metadata: { dimensions: { width: null, height: undefined } },
            },
          },
        },
      };

      expect(normaliseFavorite(entry)).toMatchObject({
        slug: 'eco-lodge',
        image: {
          url: 'https://cdn.test/alt.jpg',
          width: 800,
          height: 600,
        },
      });
    });
  });

  describe('normaliseOwnerReviews', () => {
    it('returns an empty array when no listings exist', () => {
      expect(normaliseOwnerReviews(null)).toEqual([]);
      expect(normaliseOwnerReviews({ listings: null })).toEqual([]);
    });

    it('filters out incomplete listings and reviews', () => {
      const response: OwnerReviewsResponse = {
        listings: [
          null,
          {
            slug: '  ',
            name: 'Missing slug',
            reviews: [],
          },
          {
            slug: 'eco-oasis',
            name: '  Eco Oasis  ',
            reviews: [
              null,
              { id: '  ', rating: 4 },
              { id: 'rev-1', rating: '5' as unknown as number, comment: '  Great stay  ' },
              { id: 'rev-2', rating: 0 / 0 },
            ],
          },
        ],
      };

      expect(normaliseOwnerReviews(response)).toEqual([
        {
          slug: 'eco-oasis',
          name: 'Eco Oasis',
          reviews: [
            {
              id: 'rev-1',
              rating: 5,
              comment: 'Great stay',
              createdAt: undefined,
              reviewerName: undefined,
              reviewerImage: undefined,
            },
          ],
        },
      ]);
    });
  });

  describe('formatDate', () => {
    it('formats valid ISO dates', () => {
      expect(formatDate('2024-05-17T10:30:00.000Z')).toBe('May 17, 2024');
    });

    it('returns fallback for invalid or missing dates', () => {
      expect(formatDate(undefined)).toBe('Unknown date');
      expect(formatDate('not-a-date')).toBe('Unknown date');
    });
  });
});
