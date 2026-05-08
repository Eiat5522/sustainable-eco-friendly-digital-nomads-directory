import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import {
  fetchListingCandidate,
  fetchListingCandidates,
  searchListingReferences,
} from '../listing-candidates';

jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));
jest.mock('@/lib/logger');

const fetchMock = client.fetch as jest.Mock;

describe('ChatGPT listing candidate lookup', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    jest.mocked(structuredLogger.error).mockClear();
  });

  it('fetches published Sanity listings for a requested city', async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: 'listing-1',
        name: 'Green Desk Bangkok',
        slug: 'green-desk-bangkok',
        type: 'coworking',
        city: { name: 'Bangkok', country: 'Thailand', slug: 'bangkok' },
        location: { lat: 13.7563, lng: 100.5018 },
        ecoFocusTags: [{ name: 'Zero Waste' }],
        digitalNomadFeatures: [{ name: 'Fast Wi-Fi' }],
        amenities: [{ name: 'Power outlets' }],
        coworkingDetails: {
          openingHours: [{ day: 'Monday', opens: '09:00', closes: '18:00' }],
          internetSpeed: { download: 200, upload: 80 },
        },
      },
    ]);

    const candidates = await fetchListingCandidates({ city: 'Bangkok', limit: 5 });

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('moderation.status'), {
      city: 'bangkok',
      limit: 5,
    });
    expect(candidates).toEqual([
      expect.objectContaining({
        id: 'listing-1',
        name: 'Green Desk Bangkok',
        type: 'coworking',
        canonicalUrl: '/listings/green-desk-bangkok',
        ecoFocusTags: ['Zero Waste'],
        digitalNomadFeatures: ['Fast Wi-Fi'],
        amenities: ['Power outlets'],
        openingHours: [{ day: 'Monday', opens: '09:00', closes: '18:00' }],
        planningNotes: ['Internet speed: 200 Mbps down / 80 Mbps up'],
      }),
    ]);
  });

  it('returns an empty list and logs when Sanity lookup fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Sanity unavailable'));

    await expect(fetchListingCandidates({ city: 'Bangkok' })).resolves.toEqual([]);
    expect(structuredLogger.error).toHaveBeenCalledWith(
      'Failed to fetch ChatGPT listing candidates',
      expect.any(Error),
      expect.objectContaining({ component: 'chatgpt-app/listing-candidates' })
    );
  });

  it('searches listing references with canonical URLs', async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: 'listing-2',
        name: 'Circular Cafe',
        slug: 'circular-cafe',
        type: 'cafe',
        city: { name: 'Chiang Mai', country: 'Thailand', slug: 'chiang-mai' },
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        amenities: [],
      },
    ]);

    const references = await searchListingReferences('quiet cafe Chiang Mai');

    expect(references).toEqual([
      {
        id: 'listing-2',
        title: 'Circular Cafe',
        url: '/listings/circular-cafe',
      },
    ]);
  });

  it('fetches one listing by id or slug', async () => {
    fetchMock.mockResolvedValueOnce({
      _id: 'listing-3',
      name: 'Refill Lunch',
      slug: 'refill-lunch',
      type: 'restaurant',
      city: { name: 'Bangkok', country: 'Thailand', slug: 'bangkok' },
      ecoFocusTags: [],
      digitalNomadFeatures: [],
      amenities: [],
    });

    await expect(fetchListingCandidate('refill-lunch')).resolves.toMatchObject({
      id: 'listing-3',
      slug: 'refill-lunch',
      type: 'restaurant',
    });
  });
});
