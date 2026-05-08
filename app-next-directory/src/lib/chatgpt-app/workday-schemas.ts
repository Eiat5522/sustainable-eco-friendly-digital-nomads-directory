import { z } from 'zod';

export const ListingTypeSchema = z.enum([
  'coworking',
  'cafe',
  'accommodation',
  'restaurant',
  'activities',
]);

export const BudgetSchema = z.enum(['budget', 'moderate', 'premium', 'any']);
export const WorkStyleSchema = z.enum(['quiet', 'social', 'balanced', 'outdoor']);

const TimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm 24-hour format');

const minutesFromTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

export const WorkdayPlanInputSchema = z
  .object({
    city: z.string().trim().min(1, 'City is required'),
    date: z.string().trim().min(1).optional(),
    startTime: TimeSchema.default('09:00'),
    endTime: TimeSchema.default('18:00'),
    budget: BudgetSchema.default('any'),
    workStyle: WorkStyleSchema.default('balanced'),
    priorities: z.array(z.string().trim().min(1)).max(10).default([]),
    dietaryNeeds: z.array(z.string().trim().min(1)).max(10).default([]),
  })
  .refine(input => minutesFromTime(input.endTime) > minutesFromTime(input.startTime), {
    message: 'End time must be later than start time',
    path: ['endTime'],
  });

export const ListingCitySchema = z.object({
  name: z.string().trim().min(1),
  country: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});

export const GeoPointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const OpeningHourSchema = z.object({
  day: z.string().trim().min(1),
  opens: TimeSchema,
  closes: TimeSchema,
});

export const ListingCandidateSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    type: ListingTypeSchema,
    city: ListingCitySchema,
    address: z.string().trim().nullable().default(null),
    location: GeoPointSchema.nullable().default(null),
    shortDescription: z.string().trim().nullable().default(null),
    longDescription: z.string().trim().nullable().default(null),
    website: z.string().trim().nullable().default(null),
    priceRange: z.enum(['budget', 'moderate', 'premium']).nullable().default(null),
    imageUrl: z.string().trim().nullable().default(null),
    ecoFocusTags: z.array(z.string().trim().min(1)).default([]),
    digitalNomadFeatures: z.array(z.string().trim().min(1)).default([]),
    amenities: z.array(z.string().trim().min(1)).default([]),
    openingHours: z.array(OpeningHourSchema).default([]),
    planningNotes: z.array(z.string().trim().min(1)).default([]),
    canonicalUrl: z.string().trim().min(1).optional(),
  })
  .transform(candidate => ({
    ...candidate,
    canonicalUrl: candidate.canonicalUrl ?? `/listings/${candidate.slug}`,
  }));

export const WorkdayStopSchema = z.object({
  id: z.string().trim().min(1),
  slot: z.enum(['morning', 'midday', 'afternoon', 'evening']),
  title: z.string().trim().min(1),
  startTime: TimeSchema,
  endTime: TimeSchema,
  listing: ListingCandidateSchema,
  reasons: z.array(z.string().trim().min(1)).min(1),
});

export const WorkdayItinerarySchema = z.object({
  city: z.string().trim().min(1),
  generatedAt: z.string().datetime(),
  summary: z.string().trim().min(1),
  stops: z.array(WorkdayStopSchema),
  notices: z.array(z.string().trim().min(1)).default([]),
});

export type WorkdayPlanInput = z.infer<typeof WorkdayPlanInputSchema>;
export type ListingType = z.infer<typeof ListingTypeSchema>;
export type ListingCandidate = z.output<typeof ListingCandidateSchema>;
export type WorkdayStop = z.infer<typeof WorkdayStopSchema>;
export type WorkdayItinerary = z.infer<typeof WorkdayItinerarySchema>;
