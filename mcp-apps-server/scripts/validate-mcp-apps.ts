import assert from 'node:assert/strict';
import type { z } from 'zod';
import { widgetMetadata as itineraryWidgetMetadata } from '../resources/workday-itinerary/widget';
import { workdayItineraryWidgetPropsSchema } from '../resources/workday-itinerary/types';
import { widgetMetadata as searchWidgetMetadata } from '../resources/workday-search/widget';
import { workdaySearchWidgetPropsSchema } from '../resources/workday-search/types';
import {
  fetchToolSchema,
  listingFetchOutputSchema,
  renderWorkdayInputSchema,
  searchToolOutputSchema,
  searchToolSchema,
  workdayPlanOutputSchema,
  workdayPlanToolSchema,
  type ListingCandidate,
  type WorkdayItinerary,
} from '../src/lib/workday-schemas';

const logPass = (message: string): void => {
  console.log(`[pass] ${message}`);
};

const sampleListing: ListingCandidate = {
  id: 'listing-1',
  name: 'Green Desk Bangkok',
  slug: 'green-desk-bangkok',
  type: 'coworking',
  city: {
    name: 'Bangkok',
    country: 'Thailand',
    slug: 'bangkok',
  },
  address: '123 Sukhumvit Road',
  location: { lat: 13.7563, lng: 100.5018 },
  shortDescription: 'Quiet sustainable coworking space.',
  longDescription: 'A bright coworking hub with recycled materials and strong Wi-Fi.',
  website: 'https://example.com/green-desk-bangkok',
  priceRange: 'moderate',
  imageUrl: 'https://example.com/green-desk-bangkok.jpg',
  ecoFocusTags: ['Zero Waste'],
  digitalNomadFeatures: ['Fast Wi-Fi', 'Quiet booths'],
  amenities: ['Power outlets', 'Meeting rooms'],
  openingHours: [{ day: 'Monday', opens: '09:00', closes: '18:00' }],
  planningNotes: ['Reliable internet for focus work'],
  canonicalUrl: '/listings/green-desk-bangkok',
};

const sampleItinerary: WorkdayItinerary = {
  city: 'Bangkok',
  generatedAt: '2026-05-09T09:00:00.000Z',
  summary: 'A sustainable workday in Bangkok.',
  stops: [
    {
      id: 'morning-listing-1',
      slot: 'morning',
      title: 'Start with focused cafe work',
      startTime: '09:00',
      endTime: '11:00',
      listing: {
        ...sampleListing,
        id: 'listing-2',
        name: 'Circular Cafe',
        slug: 'circular-cafe',
        type: 'cafe',
        canonicalUrl: '/listings/circular-cafe',
      },
      reasons: ['Selected as a cafe stop in Bangkok.'],
    },
  ],
  notices: ['Some selected listings are missing opening hours.'],
};

const assertWidgetMetadata = (
  label: string,
  metadata: {
    exposeAsTool?: boolean;
    metadata?: { invoking?: string; invoked?: string };
    props?: unknown;
  },
  expectedProps: z.ZodTypeAny,
  sampleProps: unknown
): void => {
  assert.equal(metadata.exposeAsTool, false, `${label} should stay resource-only`);
  assert.equal(typeof metadata.metadata?.invoking, 'string', `${label} should define invoking text`);
  assert.equal(typeof metadata.metadata?.invoked, 'string', `${label} should define invoked text`);

  const propsSchema = metadata.props as z.ZodTypeAny | undefined;
  assert(propsSchema, `${label} should expose a props schema`);
  assert(propsSchema.safeParse(sampleProps).success, `${label} widget props should validate`);
  assert(expectedProps.safeParse(sampleProps).success, `${label} shared props schema should validate`);
};

const run = (): void => {
  const parsedSearch = searchToolSchema.parse({ query: '  eco cafe bangkok  ' });
  assert.equal(parsedSearch.query, 'eco cafe bangkok');
  assert.equal(searchToolSchema.safeParse({ query: '   ' }).success, false);
  logPass('search tool schema trims valid queries and rejects blanks');

  const parsedFetch = fetchToolSchema.parse({ id: '  circular-cafe  ' });
  assert.equal(parsedFetch.id, 'circular-cafe');
  logPass('fetch tool schema trims listing identifiers');

  const parsedPlan = workdayPlanToolSchema.parse({ city: 'Bangkok' });
  assert.equal(parsedPlan.startTime, '09:00');
  assert.equal(parsedPlan.endTime, '18:00');
  assert.equal(parsedPlan.budget, 'any');
  assert.equal(parsedPlan.workStyle, 'balanced');
  assert.deepEqual(parsedPlan.priorities, []);
  assert.deepEqual(parsedPlan.dietaryNeeds, []);
  assert.equal(
    workdayPlanToolSchema.safeParse({
      city: 'Bangkok',
      startTime: '18:00',
      endTime: '09:00',
    }).success,
    false
  );
  logPass('workday planning schema applies defaults and rejects inverted time ranges');

  const searchOutput = {
    query: 'eco cafe bangkok',
    results: [{ id: 'listing-2', title: 'Circular Cafe', url: '/listings/circular-cafe' }],
  };
  assert(searchToolOutputSchema.safeParse(searchOutput).success);
  logPass('search output schema validates widget-ready structured content');

  const fetchOutput = {
    id: sampleListing.id,
    title: sampleListing.name,
    text: 'Quiet sustainable coworking space.\n\nAddress: 123 Sukhumvit Road',
    url: sampleListing.canonicalUrl,
    metadata: {
      type: sampleListing.type,
      city: sampleListing.city.name,
      ecoFocusTags: sampleListing.ecoFocusTags,
      digitalNomadFeatures: sampleListing.digitalNomadFeatures,
      amenities: sampleListing.amenities,
    },
    listing: sampleListing,
  };
  assert(listingFetchOutputSchema.safeParse(fetchOutput).success);
  logPass('fetch output schema validates normalized listing payloads');

  assert(workdayPlanOutputSchema.safeParse({ itinerary: sampleItinerary }).success);
  assert(renderWorkdayInputSchema.safeParse({ itinerary: sampleItinerary }).success);
  assert(
    renderWorkdayInputSchema.safeParse({ itinerary: JSON.stringify(sampleItinerary) }).success
  );
  logPass('plan/render itinerary schemas accept shared itinerary payloads');

  assertWidgetMetadata(
    'search',
    searchWidgetMetadata,
    workdaySearchWidgetPropsSchema,
    { query: searchOutput.query, results: searchOutput.results }
  );
  logPass('search widget metadata stays aligned with its props schema');

  assertWidgetMetadata(
    'itinerary',
    itineraryWidgetMetadata,
    workdayItineraryWidgetPropsSchema,
    { itinerary: sampleItinerary }
  );
  logPass('itinerary widget metadata stays aligned with its props schema');

  console.log('[done] MCP Apps schema validation checks passed');
};

run();
