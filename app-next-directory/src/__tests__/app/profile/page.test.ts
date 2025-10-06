

import { normaliseFavorite, normaliseOwnerReviews } from '../../../../app/profile/utils';

describe('normaliseFavorite', () => {
  it('normalises a valid favorite entry', () => {
    const entry = {
      _id: 'fav-123',
      listing: {
        _id: 'listing-456',
        name: '  Eco Retreat  ',
        slug: 'eco-retreat',
        mainImage: {
          asset: {
            url: 'https://example.com/image.jpg',
            metadata: {
              dimensions: {
                width: 800,
                height: 600,
              },
            },
          },
          altText: 'Eco retreat image',
        },
        city: {
          name: 'Lisbon',
        },
        category: 'Coworking', // Direct string instead of nested object
        ecoFocusTags: [{ name: 'Vegan Friendly' }],
        digitalNomadFeatures: [{ name: 'Fast Wifi' }],
        shortDescription: 'A lovely eco retreat',
        priceRange: 'moderate', // Use one of the allowed values: 'budget', 'moderate', 'premium'
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    } as any;

    expect(normaliseFavorite(entry)).toEqual({
      id: 'fav-123',
      name: 'Eco Retreat',
      slug: 'eco-retreat',
      city: 'Lisbon',
      country: undefined,
      type: undefined,
      category: 'Coworking',
      shortDescription: 'A lovely eco retreat',
      priceRange: 'moderate',
      ecoFocusTags: ['Vegan Friendly'],
      digitalNomadFeatures: ['Fast Wifi'],
      image: {
        url: 'https://example.com/image.jpg',
        width: 800,
        height: 600,
        alt: 'Eco retreat image',
      },
      imageUrl: 'https://example.com/image.jpg',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('falls back to defaults when optional fields are missing', () => {
    const entry = {
      listing: {
        slug: 'sustainable-hub',
        name: ' ',
        mainImage: {
          asset: {
            url: '',
          },
        },
      },
    } as any;

    expect(normaliseFavorite(entry)).toEqual({
      id: 'sustainable-hub',
      name: 'Untitled listing',
      slug: 'sustainable-hub',
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

  it('returns null when no usable slug is available', () => {
    const entry = {
      _id: 'fav-789',
      listing: {
        slug: '',
        name: 'Eco',
      },
    } as any;

    expect(normaliseFavorite(entry)).toBeNull();
  });
});

describe('normaliseOwnerReviews', () => {
  it('returns an empty array when the payload is not usable', () => {
    expect(normaliseOwnerReviews(undefined)).toEqual([]);
    expect(normaliseOwnerReviews(null)).toEqual([]);
    expect(normaliseOwnerReviews({ listings: null } as any)).toEqual([]);
  });

  it('normalises listings and filters out invalid review entries', () => {
    const response = {
      listings: [
        {
          slug: 'eco-hub',
          name: '  Eco Hub  ',
          reviews: [
            {
              id: 'rev-1',
              rating: 4.5,
              comment: 'Great stay',
              createdAt: '2024-02-02T00:00:00.000Z',
              reviewerName: 'Alex',
              reviewerImage: 'https://example.com/avatar.jpg',
            },
            {
              id: 'rev-2',
              rating: 4,
              comment: 'Lovely spot',
              createdAt: '2024-02-03T00:00:00.000Z',
              reviewerName: 'Sam',
            },
            {
              id: null,
              rating: 5,
              comment: 'Hidden gem',
              createdAt: '2024-02-04T00:00:00.000Z',
              reviewerName: 'Jamie',
            },
          ],
        },
        {
          slug: 'mystery-space',
          name: '',
          reviews: [],
        },
        {
          slug: '',
          name: 'No slug listing',
          reviews: [],
        },
      ],
    } as any;

    expect(normaliseOwnerReviews(response)).toEqual([
      {
        slug: 'eco-hub',
        name: 'Eco Hub',
        reviews: [
          {
            id: 'rev-1',
            rating: 4.5,
            comment: 'Great stay',
            createdAt: '2024-02-02T00:00:00.000Z',
            reviewerName: 'Alex',
            reviewerImage: 'https://example.com/avatar.jpg',
          },
          {
            id: 'rev-2',
            rating: 4,
            comment: 'Lovely spot',
            createdAt: '2024-02-03T00:00:00.000Z',
            reviewerName: 'Sam',
            reviewerImage: undefined,
          },
        ],
      },
      {
        slug: 'mystery-space',
        name: 'Untitled listing',
        reviews: [],
      },
    ]);
  });
});
