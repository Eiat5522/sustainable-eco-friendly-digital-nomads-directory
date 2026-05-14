import {
  ListingCandidateSchema,
  RenderWorkdayInputSchema,
  WorkdayPlanInputSchema,
  WorkdayItinerarySchema,
} from '../workday-schemas';

describe('ChatGPT workday planner schemas', () => {
  it('accepts a minimal valid planning request', () => {
    const parsed = WorkdayPlanInputSchema.parse({
      city: 'Bangkok',
      priorities: ['fast wifi', 'plant-based food'],
    });

    expect(parsed).toMatchObject({
      city: 'Bangkok',
      budget: 'any',
      workStyle: 'balanced',
      priorities: ['fast wifi', 'plant-based food'],
    });
  });

  it('rejects blank city values', () => {
    expect(() => WorkdayPlanInputSchema.parse({ city: '   ' })).toThrow();
  });

  it('rejects an end time that is not later than the start time', () => {
    expect(() =>
      WorkdayPlanInputSchema.parse({
        city: 'Chiang Mai',
        startTime: '17:00',
        endTime: '09:00',
      })
    ).toThrow(/End time must be later than start time/);
  });

  it('normalizes candidate listing fields used by the planner', () => {
    const parsed = ListingCandidateSchema.parse({
      id: 'listing-1',
      name: 'Green Desk Bangkok',
      slug: 'green-desk-bangkok',
      type: 'coworking',
      city: { name: 'Bangkok', country: 'Thailand', slug: 'bangkok' },
      ecoFocusTags: ['Zero Waste'],
      digitalNomadFeatures: ['Fast Wi-Fi'],
      amenities: ['Power outlets'],
    });

    expect(parsed.location).toBeNull();
    expect(parsed.priceRange).toBeNull();
    expect(parsed.canonicalUrl).toBe('/listings/green-desk-bangkok');
  });

  it('accepts a complete itinerary with notices', () => {
    const parsed = WorkdayItinerarySchema.parse({
      city: 'Bangkok',
      generatedAt: '2026-05-08T01:00:00.000Z',
      summary: 'A balanced sustainable workday in Bangkok.',
      stops: [
        {
          id: 'stop-1',
          slot: 'morning',
          title: 'Start with focused cafe work',
          startTime: '09:00',
          endTime: '11:00',
          listing: {
            id: 'listing-1',
            name: 'Green Cup',
            slug: 'green-cup',
            type: 'cafe',
            city: { name: 'Bangkok', country: 'Thailand', slug: 'bangkok' },
            ecoFocusTags: [],
            digitalNomadFeatures: [],
            amenities: [],
          },
          reasons: ['Matches cafe work style'],
        },
      ],
      notices: ['Opening hours were unavailable for one stop.'],
    });

    expect(parsed.stops).toHaveLength(1);
    expect(parsed.notices).toEqual(['Opening hours were unavailable for one stop.']);
  });

  it('accepts a stringified itinerary payload for widget rendering', () => {
    const parsed = RenderWorkdayInputSchema.parse({
      itinerary: JSON.stringify({
        city: 'Bangkok',
        generatedAt: '2026-05-08T01:00:00.000Z',
        summary: 'A balanced sustainable workday in Bangkok.',
        stops: [
          {
            id: 'stop-1',
            slot: 'morning',
            title: 'Start with focused cafe work',
            startTime: '09:00',
            endTime: '11:00',
            listing: {
              id: 'listing-1',
              name: 'Green Cup',
              slug: 'green-cup',
              type: 'cafe',
              city: { name: 'Bangkok', country: 'Thailand', slug: 'bangkok' },
              ecoFocusTags: [],
              digitalNomadFeatures: [],
              amenities: [],
            },
            reasons: ['Matches cafe work style'],
          },
        ],
        notices: ['Opening hours were unavailable for one stop.'],
      }),
    });

    expect(parsed.itinerary.summary).toBe('A balanced sustainable workday in Bangkok.');
    expect(parsed.itinerary.stops).toHaveLength(1);
  });
});
