import { z } from 'zod';

export const listingTypeSchema = z
  .enum(['coworking', 'cafe', 'accommodation', 'restaurant', 'activities'])
  .describe('Published listing category used by the sustainable directory.');

export const budgetSchema = z
  .enum(['budget', 'moderate', 'premium', 'any'])
  .describe('Budget preference for the workday plan.');

export const workStyleSchema = z
  .enum(['quiet', 'social', 'balanced', 'outdoor'])
  .describe('Preferred atmosphere for the workday plan.');

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm 24-hour format')
  .describe('Time in HH:mm 24-hour format.');

const minutesFromTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

export const listingReferenceSchema = z.object({
  id: z.string().trim().min(1).describe('Stable listing identifier or listing slug.'),
  title: z.string().trim().min(1).describe('Human-readable listing title.'),
  url: z.string().trim().min(1).describe('Canonical listing URL or relative directory path.'),
});

export const listingCitySchema = z.object({
  name: z.string().trim().min(1).describe('City name for the listing.'),
  country: z.string().trim().min(1).describe('Country name for the listing city.'),
  slug: z.string().trim().min(1).describe('City slug used by the directory.'),
});

export const geoPointSchema = z.object({
  lat: z.number().describe('Latitude for the listing location.'),
  lng: z.number().describe('Longitude for the listing location.'),
});

export const openingHourSchema = z.object({
  day: z.string().trim().min(1).describe('Weekday label for the opening window.'),
  opens: timeSchema,
  closes: timeSchema,
});

export const listingCandidateSchema = z.object({
  id: z.string().trim().min(1).describe('Stable Sanity document id for the listing.'),
  name: z.string().trim().min(1).describe('Listing display name.'),
  slug: z.string().trim().min(1).describe('Listing slug used in directory URLs.'),
  type: listingTypeSchema,
  city: listingCitySchema,
  address: z.string().trim().nullable().describe('Optional street address for the listing.'),
  location: geoPointSchema.nullable().describe('Optional geographic coordinates for the listing.'),
  shortDescription: z
    .string()
    .trim()
    .nullable()
    .describe('Short marketing description for the listing.'),
  longDescription: z
    .string()
    .trim()
    .nullable()
    .describe('Long-form description for the listing.'),
  website: z
    .string()
    .trim()
    .nullable()
    .describe('Optional external website for the listing.'),
  priceRange: z
    .enum(['budget', 'moderate', 'premium'])
    .nullable()
    .describe('Optional price range classification for the listing.'),
  imageUrl: z
    .string()
    .trim()
    .nullable()
    .describe('Optional primary image URL for the listing.'),
  ecoFocusTags: z
    .array(z.string().trim().min(1).describe('Sustainability tag applied to the listing.'))
    .describe('Sustainability tags associated with the listing.'),
  digitalNomadFeatures: z
    .array(z.string().trim().min(1).describe('Remote-work-friendly feature for the listing.'))
    .describe('Digital nomad features associated with the listing.'),
  amenities: z
    .array(z.string().trim().min(1).describe('Amenity available at the listing.'))
    .describe('Amenities associated with the listing.'),
  openingHours: z
    .array(openingHourSchema)
    .describe('Structured opening hours extracted from the listing details.'),
  planningNotes: z
    .array(z.string().trim().min(1).describe('Planning note derived from listing-specific details.'))
    .describe('Operational notes that help itinerary planning.'),
  canonicalUrl: z
    .string()
    .trim()
    .min(1)
    .describe('Canonical URL for the listing within the directory.'),
});

export const workdayStopSchema = z.object({
  id: z.string().trim().min(1).describe('Stable identifier for one itinerary stop.'),
  slot: z
    .enum(['morning', 'midday', 'afternoon', 'evening'])
    .describe('Workday slot assigned to this stop.'),
  title: z.string().trim().min(1).describe('Human-readable title for the stop.'),
  startTime: timeSchema,
  endTime: timeSchema,
  listing: listingCandidateSchema.describe('Listing chosen for this itinerary stop.'),
  reasons: z
    .array(z.string().trim().min(1).describe('Reason that explains why the stop was selected.'))
    .min(1)
    .describe('Selection rationale for the stop.'),
});

export const workdayItinerarySchema = z.object({
  city: z.string().trim().min(1).describe('City used to generate the itinerary.'),
  generatedAt: z.string().datetime().describe('ISO timestamp for when the itinerary was generated.'),
  summary: z.string().trim().min(1).describe('One-line summary of the itinerary.'),
  stops: z.array(workdayStopSchema).describe('Ordered workday stops from morning to evening.'),
  notices: z
    .array(z.string().trim().min(1).describe('Planning notice or data limitation for the itinerary.'))
    .describe('Advisory notices surfaced while building the itinerary.'),
});

export const searchToolSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .describe('Keyword query to search published sustainable directory listings.'),
});

export const fetchToolSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .describe('Listing id or listing slug to fetch from the sustainable directory.'),
});

export const workdayPlanToolSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1)
    .describe('City name to plan the sustainable workday around.'),
  date: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe('Optional date for the workday plan, if the caller wants to include one.'),
  startTime: timeSchema.default('09:00'),
  endTime: timeSchema.default('18:00'),
  budget: budgetSchema.default('any'),
  workStyle: workStyleSchema.default('balanced'),
  priorities: z
    .array(z.string().trim().min(1).describe('Priority, preference, or feature to prioritize.'))
    .max(10)
    .default([])
    .describe('Desired sustainability or remote-work priorities for the day.'),
  dietaryNeeds: z
    .array(z.string().trim().min(1).describe('Dietary need or food preference to consider.'))
    .max(10)
    .default([])
    .describe('Dietary needs that should influence meal stop selection.'),
}).refine(input => minutesFromTime(input.endTime) > minutesFromTime(input.startTime), {
  message: 'End time must be later than start time',
  path: ['endTime'],
});

export const listingFetchOutputSchema = z.object({
  id: z.string().trim().min(1).describe('Stable listing identifier.'),
  title: z.string().trim().min(1).describe('Listing title.'),
  text: z.string().trim().min(1).describe('Human-readable listing details summary.'),
  url: z.string().trim().min(1).describe('Canonical listing URL or relative path.'),
  metadata: z.object({
    type: listingTypeSchema,
    city: z.string().trim().min(1).describe('City name for the listing.'),
    ecoFocusTags: z
      .array(z.string().trim().min(1).describe('Sustainability tag associated with the listing.'))
      .describe('Sustainability tags associated with the listing.'),
    digitalNomadFeatures: z
      .array(z.string().trim().min(1).describe('Digital nomad feature associated with the listing.'))
      .describe('Digital nomad features associated with the listing.'),
    amenities: z
      .array(z.string().trim().min(1).describe('Amenity associated with the listing.'))
      .describe('Amenities associated with the listing.'),
  }),
  listing: listingCandidateSchema.describe('Normalized listing payload for widget rendering or downstream use.'),
});

export const workdayPlanOutputSchema = z.object({
  itinerary: workdayItinerarySchema.describe('Generated sustainable workday itinerary.'),
});

export const searchToolOutputSchema = z.object({
  query: z.string().trim().min(1).describe('Original query that produced the search results.'),
  results: z
    .array(listingReferenceSchema)
    .describe('Listing references returned for the current search query.'),
});

export const renderWorkdayInputSchema = z.object({
  itinerary: z.preprocess(
    value => {
      if (typeof value !== 'string') {
        return value;
      }
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return value;
      }
    },
    workdayItinerarySchema
  ).describe('Previously generated itinerary to render in a widget.'),
});

export type ListingCandidate = z.infer<typeof listingCandidateSchema>;
export type ListingFetchOutput = z.infer<typeof listingFetchOutputSchema>;
export type ListingReference = z.infer<typeof listingReferenceSchema>;
export type WorkdayItinerary = z.infer<typeof workdayItinerarySchema>;
export type WorkdayStop = z.infer<typeof workdayStopSchema>;
