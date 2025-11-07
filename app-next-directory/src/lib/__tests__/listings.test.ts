import type { SanityListingRaw } from '../listings';

describe('listings library', () => {
  const loadListingsLib = () => require('../listings') as typeof import('../listings');

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('legacy JSON mapping helpers', () => {
    it('getListingsByCity normalizes legacy data into typed listings', () => {
      const mockListings = [
        {
          id: 'legacy-1',
          name: 'Legacy Alpha',
          city: 'Bangkok',
          slug: 'legacy-alpha',
          category: 'Activities',
          address: '1 Sustainability Way',
          shortDescription: 'Eco friendly',
          longDescription: 'All the green things',
          primary_image_url: 'https://images.example/alpha-primary.jpg',
          gallery_image_urls: ['https://images.example/alpha-gallery.jpg'],
          ecoFocusTags: ['Solar Panels', { name: 'Zero Waste' }, { label: 'ignored' }],
          digitalNomadFeatures: ['Fast Wifi', { name: 'Phone booths' }, null],
          lastVerifiedDate: '2024-02-14',
          location: { lat: 1.234, lng: 4.321 },
        },
        {
          _id: 'legacy-2',
          name: 'Legacy Beta',
          city: {
            _id: 'city-2',
            name: 'Bangkok',
            slug: { current: 'bangkok-city' },
          },
          slug: { _type: 'slug', current: 'legacy-beta' },
          type: 'co working',
          address: '2 Sustainability Way',
          primaryImage: 'https://images.example/beta-primary.jpg',
          galleryImages: [
            'https://images.example/beta-gallery-a.jpg',
            { _type: 'image', asset: { url: 'https://images.example/beta-gallery-b.jpg' } },
            { asset: { url: 'https://images.example/beta-gallery-c.jpg' } },
            { foo: 'bar' },
          ],
          ecoTags: [{ name: 'Water Saver' }],
          digitalNomadFeatures: [{ name: 'Focus rooms' }, 'Phone booths', null],
        },
        {
          _id: 'legacy-4',
          name: 'Legacy Keeps Ref',
          city: {
            _id: 'city-99',
            name: 'Bangkok',
            slug: { current: 'bangkok-ref' },
          },
          slug: { _type: 'slug', current: 'legacy-keeps-ref' },
          category: 'activities',
          primaryImage: {
            _type: 'image',
            asset: { _ref: 'image-legacy-kept', url: 'https://images.example/keep-ref.jpg' },
          },
        },
        {
          _id: 'legacy-3',
          name: 'Legacy Outside City',
          city: 'Chiang Mai',
          slug: 'legacy-outside',
          category: 'cafe',
          digitalNomadFeatures: [],
          ecoFocusTags: [],
        },
      ];

      jest.doMock('../../data/listings.json', () => mockListings);
      const { getListingsByCity } = loadListingsLib();

      const results = getListingsByCity('Bangkok');
      expect(results).toHaveLength(3);

      const alpha = results.find((listing) => listing._id === 'legacy-1');
      const beta = results.find((listing) => listing._id === 'legacy-2');
      const keepRef = results.find((listing) => listing._id === 'legacy-4');
      if (!alpha || !beta || !keepRef) {
        throw new Error('Expected normalized listings to be present');
      }

      expect(alpha.slug).toEqual({ _type: 'slug', current: 'legacy-alpha' });
      expect(alpha.city?.name).toBe('Bangkok');
      expect(alpha.city?.slug.current).toBe('bangkok');
      expect(alpha.type).toBe('activities');
      expect(alpha.primaryImage?.asset.url).toBe('https://images.example/alpha-primary.jpg');
      expect(alpha.primaryImage?.asset._ref).toBe('placeholder-ref');
      expect(alpha.galleryImages).toEqual([
        { _type: 'image', asset: { url: 'https://images.example/alpha-gallery.jpg' } },
      ]);
      expect(alpha.ecoFocusTags).toEqual([
        {
          _id: 'solar-panels',
          name: 'Solar Panels',
          slug: { current: 'solar-panels' },
        },
        {
          _id: 'zero-waste',
          name: 'Zero Waste',
          slug: { current: 'zero-waste' },
        },
      ]);
      expect(alpha.digitalNomadFeatures).toEqual(['Fast Wifi', 'Phone booths']);
      expect(alpha.location).toEqual({ lat: 1.234, lng: 4.321 });

      expect(beta.slug).toEqual({ _type: 'slug', current: 'legacy-beta' });
      expect(beta.city).toEqual({
        _id: 'city-2',
        name: 'Bangkok',
        slug: { _type: 'slug', current: 'bangkok-city' },
      });
      expect(beta.type).toBe('coworking');
      expect(beta.primaryImage?.asset.url).toBe('https://images.example/beta-primary.jpg');
      expect(beta.galleryImages).toEqual([
        { _type: 'image', asset: { url: 'https://images.example/beta-gallery-a.jpg' } },
        { _type: 'image', asset: { url: 'https://images.example/beta-gallery-b.jpg' } },
        { _type: 'image', asset: { url: 'https://images.example/beta-gallery-c.jpg' } },
        { foo: 'bar' },
      ]);
      expect(beta.ecoFocusTags).toEqual([
        {
          _id: 'water-saver',
          name: 'Water Saver',
          slug: { current: 'water-saver' },
        },
      ]);
      expect(beta.digitalNomadFeatures).toEqual(['Focus rooms', 'Phone booths']);
      expect(beta.location).toEqual({ lat: 0, lng: 0 });

      expect(keepRef.primaryImage?.asset._ref).toBe('image-legacy-kept');
      expect(keepRef.primaryImage?.asset.url).toBe('https://images.example/keep-ref.jpg');
    });

    it('filterListings applies city, category, eco tag, and digital nomad filters together', () => {
      const mockListings = [
        {
          id: 'legacy-a',
          name: 'Alpha Activities',
          city: 'Bangkok',
          slug: 'alpha-activities',
          category: 'Activities',
          ecoFocusTags: ['Solar'],
          digitalNomadFeatures: ['Wifi'],
          primary_image_url: 'https://images.example/alpha.jpg',
        },
        {
          id: 'legacy-b',
          name: 'Beta Cafe',
          city: 'Bangkok',
          slug: 'beta-cafe',
          category: 'Cafe',
          ecoFocusTags: [],
          digitalNomadFeatures: ['Standing desks'],
          primary_image_url: 'https://images.example/beta.jpg',
        },
        {
          id: 'legacy-c',
          name: 'Gamma Stay',
          city: 'Lisbon',
          slug: 'gamma-stay',
          category: 'Accommodation',
          ecoFocusTags: ['Organic'],
          digitalNomadFeatures: [],
          primary_image_url: 'https://images.example/gamma.jpg',
        },
        {
          id: 'legacy-d',
          name: 'Fallback Type',
          city: 'Bangkok',
          slug: 'fallback-type',
          type: 'unlisted-category',
          ecoFocusTags: [],
          digitalNomadFeatures: [],
          primary_image_url: 'https://images.example/fallback.jpg',
        },
      ];

      jest.doMock('../../data/listings.json', () => mockListings);
      const { filterListings } = loadListingsLib();

      const allListings = filterListings({});
      expect(allListings).toHaveLength(4);
      expect(allListings.find((item) => item.name === 'Fallback Type')?.type).toBe('coworking');

      const cityMatches = filterListings({ city: 'bangkok' });
      expect(cityMatches.map((item) => item.name)).toEqual([
        'Alpha Activities',
        'Beta Cafe',
        'Fallback Type',
      ]);

      const activities = filterListings({ category: 'activity' });
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('activities');

      const withEco = filterListings({ hasEcoTags: true });
      expect(withEco.map((item) => item.name)).toEqual([
        'Alpha Activities',
        'Gamma Stay',
      ]);

      const withDigitalNomadFeatures = filterListings({ hasDnFeatures: true });
      expect(withDigitalNomadFeatures.map((item) => item.name)).toEqual([
        'Alpha Activities',
        'Beta Cafe',
      ]);

      const combined = filterListings({ city: 'Bangkok', hasEcoTags: true, hasDnFeatures: true });
      expect(combined).toHaveLength(1);
      expect(combined[0].name).toBe('Alpha Activities');
    });
  });

  describe('city filtering safety', () => {
    it('skips listings without a city when filtering by city name', () => {
      const mockListings = [
        { id: 'with-city', name: 'Has City', city: 'Lisbon', slug: 'has-city' },
        { id: 'missing-city', name: 'Missing City', slug: 'missing-city' },
      ];

      jest.doMock('../../data/listings.json', () => mockListings);
      const { filterListings } = loadListingsLib();

      expect(() => filterListings({ city: 'lisbon' })).not.toThrow();
      const matches = filterListings({ city: 'lisbon' });
      expect(matches.map((listing) => listing._id)).toEqual(['with-city']);
    });
  });

  describe('Sanity mapping utilities', () => {
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
      ] as unknown as SanityListingRaw['reviews'],
      amenities: [
        { _id: 'amenity-1', name: 'Solar Power' },
        null,
      ] as unknown as SanityListingRaw['amenities'],
      contactPhone: '123-456',
      contactEmail: 'info@example.com',
      lastVerifiedDate: '2024-02-14',
      coworkingDetails: { seats: 20 },
      accommodationDetails: null,
      cafeDetails: { beans: 'Local' },
      restaurantDetails: undefined,
      activitiesDetails: { equipment: 'Included' },
    });

    it('validates Sanity listing shape', () => {
      jest.doMock('../../data/listings.json', () => []);
      const { isSanityListing } = loadListingsLib();

      expect(isSanityListing(buildValidSanity())).toBe(true);
      expect(isSanityListing({ ...buildValidSanity(), _id: '   ' })).toBe(false);
      expect(isSanityListing({ ...buildValidSanity(), name: '' })).toBe(false);
      expect(isSanityListing({ ...buildValidSanity(), slug: { _type: 'slug', current: '' } })).toBe(false);
    });

    it('maps Sanity listing to card DTO and guards invalid input', () => {
      jest.doMock('../../data/listings.json', () => []);
      const { mapSanityListingToCard } = loadListingsLib();

      expect(() => mapSanityListingToCard({})).toThrow('Invalid Sanity listing object');

      const sanity = buildValidSanity();
      const card = mapSanityListingToCard(sanity);
      expect(card.id).toBe('sanity-1');
      expect(card.slug).toBe('sanity-listing');
      expect(card.city).toEqual({ id: 'city-1', name: 'Sanity City', slug: 'sanity-city', country: 'SC' });
      expect(card.ecoFocusTags).toEqual(['Solar', 'Wind']);
      expect(card.digitalNomadFeatures).toEqual(['Focus rooms', 'Standing desks']);
      expect(card.galleryImages).toEqual(sanity.galleryImages);
      expect(card.website).toBeNull();
    });

    it('maps Sanity listing to detailed DTO including nested collections', () => {
      jest.doMock('../../data/listings.json', () => []);
      const { mapSanityListingToAppListingDetail } = loadListingsLib();

      const detail = mapSanityListingToAppListingDetail(buildValidSanity());
      expect(detail.id).toBe('sanity-1');
      expect(detail.slug).toBe('sanity-listing');
      expect(detail.city).toEqual({ id: 'city-1', name: 'Sanity City', slug: 'sanity-city', country: 'SC' });
      expect(detail.website).toBeUndefined();
      expect(detail.digitalNomadFeatures).toEqual(['Focus rooms', 'Standing desks']);
      expect(detail.ecoFocusTags).toEqual(['Solar', 'Wind']);
      expect(detail.reviews).toHaveLength(2);
      expect(detail.reviews[0]).toEqual({
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
          description: undefined,
          badge: undefined,
        },
      ]);
      expect(detail.coworkingDetails).toEqual({ seats: 20 });
      expect(detail.cafeDetails).toEqual({ beans: 'Local' });
      expect(detail.activitiesDetails).toEqual({ equipment: 'Included' });
    });
  });
});
