import { createWorkdayListingCandidateService } from '../listing-candidates';

describe('shared workday listing candidate service', () => {
  const fetchMock = jest.fn();
  const logError = jest.fn();

  const service = createWorkdayListingCandidateService({
    fetch: fetchMock,
    logError,
    component: 'test/workday-domain',
  });

  beforeEach(() => {
    fetchMock.mockReset();
    logError.mockReset();
  });

  it('normalizes raw Sanity listings for planning use', async () => {
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

    await expect(service.fetchListingCandidates({ city: 'Bangkok', limit: 5 })).resolves.toEqual([
      expect.objectContaining({
        id: 'listing-1',
        canonicalUrl: '/listings/green-desk-bangkok',
        planningNotes: ['Internet speed: 200 Mbps down / 80 Mbps up'],
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('moderation.status'), {
      city: 'bangkok',
      limit: 5,
    });
  });

  it('logs and returns safe fallbacks when lookups fail', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Sanity unavailable'));

    await expect(service.fetchListingCandidates({ city: 'Bangkok' })).resolves.toEqual([]);
    expect(logError).toHaveBeenCalledWith(
      'Failed to fetch workday listing candidates',
      expect.any(Error),
      expect.objectContaining({ component: 'test/workday-domain', city: 'Bangkok' })
    );
  });
});
