import { planSustainableWorkday } from '../workday-planner';
import type { ListingCandidate } from '../workday-schemas';

const makeCandidate = (
  overrides: Partial<ListingCandidate> & Pick<ListingCandidate, 'id' | 'name' | 'slug' | 'type'>
): ListingCandidate => ({
  id: overrides.id,
  name: overrides.name,
  slug: overrides.slug,
  type: overrides.type,
  city: overrides.city ?? { name: 'Bangkok', country: 'Thailand', slug: 'bangkok' },
  address: overrides.address ?? null,
  location: 'location' in overrides ? (overrides.location ?? null) : { lat: 13.7563, lng: 100.5018 },
  shortDescription: overrides.shortDescription ?? null,
  longDescription: overrides.longDescription ?? null,
  website: overrides.website ?? null,
  priceRange: overrides.priceRange ?? 'moderate',
  imageUrl: overrides.imageUrl ?? null,
  ecoFocusTags: overrides.ecoFocusTags ?? [],
  digitalNomadFeatures: overrides.digitalNomadFeatures ?? [],
  amenities: overrides.amenities ?? [],
  openingHours: overrides.openingHours ?? [{ day: 'Monday', opens: '08:00', closes: '18:00' }],
  planningNotes: overrides.planningNotes ?? [],
  canonicalUrl: overrides.canonicalUrl ?? `/listings/${overrides.slug}`,
});

describe('planSustainableWorkday', () => {
  it('builds an ordered sustainable itinerary from candidate listings', () => {
    const itinerary = planSustainableWorkday(
      {
        city: 'Bangkok',
        startTime: '09:00',
        endTime: '18:00',
        budget: 'moderate',
        workStyle: 'quiet',
        priorities: ['fast wifi', 'zero waste'],
        dietaryNeeds: ['vegan'],
      },
      [
        makeCandidate({
          id: 'cafe-1',
          name: 'Circular Morning Cafe',
          slug: 'circular-morning-cafe',
          type: 'cafe',
          ecoFocusTags: ['Zero Waste'],
          digitalNomadFeatures: ['Fast Wi-Fi'],
          amenities: ['Quiet zone'],
        }),
        makeCandidate({
          id: 'cowork-1',
          name: 'Green Desk Bangkok',
          slug: 'green-desk-bangkok',
          type: 'coworking',
          ecoFocusTags: ['Renewable Energy'],
          digitalNomadFeatures: ['Fast Wi-Fi', 'Quiet workspace'],
          amenities: ['Power outlets'],
        }),
        makeCandidate({
          id: 'restaurant-1',
          name: 'Plant Plate',
          slug: 'plant-plate',
          type: 'restaurant',
          ecoFocusTags: ['Local Sourcing'],
          amenities: ['Vegan options'],
          planningNotes: ['Dietary options: vegan, vegetarian'],
        }),
        makeCandidate({
          id: 'activity-1',
          name: 'Canal Refill Walk',
          slug: 'canal-refill-walk',
          type: 'activities',
          ecoFocusTags: ['Low Impact'],
        }),
      ],
      new Date('2026-05-08T01:00:00.000Z')
    );

    expect(itinerary.city).toBe('Bangkok');
    expect(itinerary.summary).toContain('4-stop sustainable workday');
    expect(itinerary.stops.map(stop => stop.slot)).toEqual([
      'morning',
      'midday',
      'afternoon',
      'evening',
    ]);
    expect(itinerary.stops.map(stop => stop.listing.slug)).toEqual([
      'circular-morning-cafe',
      'green-desk-bangkok',
      'plant-plate',
      'canal-refill-walk',
    ]);
    expect(itinerary.notices).toEqual([]);
  });

  it('returns notices instead of failing when category coverage is incomplete', () => {
    const itinerary = planSustainableWorkday(
      { city: 'Chiang Mai', priorities: [] },
      [
        makeCandidate({
          id: 'cowork-1',
          name: 'Forest Focus',
          slug: 'forest-focus',
          type: 'coworking',
          city: { name: 'Chiang Mai', country: 'Thailand', slug: 'chiang-mai' },
          openingHours: [],
          location: null,
        }),
      ],
      new Date('2026-05-08T01:00:00.000Z')
    );

    expect(itinerary.stops).toHaveLength(1);
    expect(itinerary.notices).toEqual(
      expect.arrayContaining([
        'No cafe listing was available for the morning stop.',
        'Some selected listings are missing coordinates.',
        'Some selected listings are missing opening hours.',
      ])
    );
  });

  it('uses stable tie-breaking for equally scored candidates', () => {
    const itinerary = planSustainableWorkday(
      { city: 'Bangkok', priorities: ['wifi'] },
      [
        makeCandidate({
          id: 'cafe-b',
          name: 'Beta Cafe',
          slug: 'beta-cafe',
          type: 'cafe',
          digitalNomadFeatures: ['Wi-Fi'],
        }),
        makeCandidate({
          id: 'cafe-a',
          name: 'Alpha Cafe',
          slug: 'alpha-cafe',
          type: 'cafe',
          digitalNomadFeatures: ['Wi-Fi'],
        }),
      ],
      new Date('2026-05-08T01:00:00.000Z')
    );

    expect(itinerary.stops[0]?.listing.slug).toBe('alpha-cafe');
  });
});
