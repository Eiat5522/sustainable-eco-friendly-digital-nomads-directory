import {
  isSanityListing,
  mapSanityListingToAppListingDetail,
  mapSanityListingToCard,
  SanityListingRaw,
} from '../listings';

const buildValidSanity = (): SanityListingRaw => ({
  _id: 'sanity-1',
  name: 'Sanity Listing',
  slug: { _type: 'slug', current: 'sanity-listing' },
  city: {
    _id: 'city-1',
    name: 'Sanity City',
    slug: { _type: 'slug', current: 'sanity-city' },
    country: 'SC',
  },
  ecoFocusTags: ['Solar', { name: 'Wind' }],
  digitalNomadFeatures: [{ name: 'Focus rooms' }, 'Standing desks'],
  priceRange: '$$',
  website: null,
  primaryImage: { _type: 'image', asset: { url: 'https://images.example/hero.jpg' } },
  galleryImages: [{ _type: 'image', asset: { url: 'https://images.example/gallery.jpg' } }],
  shortDescription: 'Short desc',
  address: '123 Eco Way',
  category: 'coworking',
  location: { lat: 10, lng: 20 },
  type: 'coworking',
  longDescription: 'Long description',
  reviews: [
    {
      _id: 'review-1',
      user: { _id: 'user-1', name: '  Alice  ', image: '   ' },
      rating: 5,
      comment: 'Great',
      createdAt: '2024-01-01',
    },
    null,
    {
      _id: 'review-2',
      user: {},
      rating: 4,
      comment: 'Ok',
    },
    'invalid',
  ],
  amenities: [
    {
      _id: 'amenity-1',
      name: 'Solar Power',
      description: 'Clean energy',
      badge: { asset: { url: 'https://images.example/badge.jpg' } },
    },
    null,
  ],
  contactPhone: '123-456',
  contactEmail: 'info@example.com',
  lastVerifiedDate: '2024-02-14',
  coworkingDetails: { seats: 20 },
  accommodationDetails: null,
  cafeDetails: { beans: 'Local' },
  restaurantDetails: undefined,
  activitiesDetails: { equipment: 'Included' },
});

describe('listings library', () => {
  describe('Sanity mapping utilities', () => {
    it('validates Sanity listing shape', () => {
      const sanity = buildValidSanity();
      expect(isSanityListing(sanity)).toBe(true);
      expect(isSanityListing({})).toBe(false);
      expect(isSanityListing({ ...sanity, _id: '   ' })).toBe(false);
      expect(isSanityListing({ ...sanity, name: '' })).toBe(false);
      expect(isSanityListing({ ...sanity, slug: { _type: 'slug', current: '' } })).toBe(false);
    });

    it('maps Sanity listing to card DTO and guards invalid input', () => {
      expect(() => mapSanityListingToCard({})).toThrow('Invalid Sanity listing object');

      const card = mapSanityListingToCard(buildValidSanity());
      expect(card).toEqual({
        id: 'sanity-1',
        name: 'Sanity Listing',
        slug: 'sanity-listing',
        city: { id: 'city-1', name: 'Sanity City', slug: 'sanity-city', country: 'SC' },
        ecoFocusTags: ['Solar', 'Wind'],
        digitalNomadFeatures: ['Focus rooms', 'Standing desks'],
        priceRange: '$$',
        website: null,
        primaryImage: { _type: 'image', asset: { url: 'https://images.example/hero.jpg' } },
        galleryImages: [{ _type: 'image', asset: { url: 'https://images.example/gallery.jpg' } }],
        shortDescription: 'Short desc',
        address: '123 Eco Way',
        category: 'coworking',
        location: { lat: 10, lng: 20 },
        type: 'coworking',
      });
    });

    it('maps Sanity listing to detailed DTO including nested collections', () => {
      const detail = mapSanityListingToAppListingDetail(buildValidSanity());
      expect(detail.id).toBe('sanity-1');
      expect(detail.slug).toBe('sanity-listing');
      expect(detail.city).toEqual({
        id: 'city-1',
        name: 'Sanity City',
        slug: 'sanity-city',
        country: 'SC',
      });
      expect(detail.website).toBeUndefined();
      expect(detail.ecoFocusTags).toEqual(['Solar', 'Wind']);
      expect(detail.digitalNomadFeatures).toEqual(['Focus rooms', 'Standing desks']);
      expect(detail.priceRange).toBe('$$');
      expect(detail.location).toEqual({ lat: 10, lng: 20 });
      expect(detail.reviews).toHaveLength(2);
      expect(detail.reviews[0]).toMatchObject({
        id: 'review-1',
        listingId: 'sanity-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Great',
        user: { name: 'Alice' },
        createdAt: '2024-01-01',
      });
      expect(detail.reviews[1].user).toEqual({ name: 'Anonymous' });
      expect(detail.amenities).toEqual([
        {
          _id: 'amenity-1',
          name: 'Solar Power',
          description: 'Clean energy',
          badge: { asset: { url: 'https://images.example/badge.jpg' } },
        },
      ]);
      expect(detail.coworkingDetails).toEqual({ seats: 20 });
      expect(detail.cafeDetails).toEqual({ beans: 'Local' });
      expect(detail.activitiesDetails).toEqual({ equipment: 'Included' });
    });
  });
});
