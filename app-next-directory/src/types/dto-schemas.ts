// Runtime validation schemas for DTOs
// File: src/types/dto-schemas.ts

import { z } from 'zod';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';
import type { InternetSpeedValue } from './dto';

// Shared primitives
export const GeoPointSchema = z.object({ lat: z.number(), lng: z.number() }).strict();

export const ImageDimensionsDTOSchema = z
  .object({ width: z.number().optional(), height: z.number().optional() })
  .partial()
  .strict();

const CityDTOSchemaBase = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    country: z.string(),
    sustainabilityScore: z.number().min(0).max(100).optional(),
    highlights: z.array(z.string()).optional(),
    imageUrl: z.string().nullable().optional(),
    imageDimensions: ImageDimensionsDTOSchema.nullable().optional(),
    description: z.string().optional(),
  })
  .strict();

export const CityDTOSchema = CityDTOSchemaBase;

const InternetSpeedDTOSchema = z
  .object({
    download: z.number().nonnegative(),
    upload: z.number().nonnegative(),
    lastTested: z.string().optional(),
  })
  .strict();

const InternetSpeedValueSchema: z.ZodType<InternetSpeedValue> = z.union([
  z.number().nonnegative(),
  InternetSpeedDTOSchema,
]);

const CityDetailDTOSchemaBase = CityDTOSchemaBase.extend({
  shortDescription: z.string().optional(),
  airQuality: z.string().optional(),
  internetSpeed: InternetSpeedValueSchema.optional(),
  costOfLiving: z.string().optional(),
  climate: z.string().optional(),
  safety: z.string().optional(),
  walkability: z.string().optional(),
  sustainabilityInitiatives: z.array(z.string()).optional(),
  digitalNomadFeatures: z.array(z.string()).optional(),
  galleryImages: z.array(z.string().url()).optional(),
}).strict();

export const CityDetailDTOSchema = CityDetailDTOSchemaBase;

export const ListingStatusDTOSchema = z.enum([
  'draft',
  'pending',
  'published',
  'archived',
  'flagged',
]);

export const VerificationStatusDTOSchema = z.enum(['unverified', 'verified', 'needs_verification']);

export const BaseListingDTOSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(DEFAULT_CATEGORIES),
    city: CityDTOSchemaBase.nullable(),
    imageUrl: z.string().optional(),
    ecoFocusTags: z.array(z.string()).optional(),
    digitalNomadFeatures: z.array(z.string()).optional(),
    priceRange: z.enum(['budget', 'moderate', 'premium']).nullable().optional(),
    website: z.string().url().optional(),
    address: z.string().optional(),
    location: GeoPointSchema.optional(),
    status: ListingStatusDTOSchema.optional(),
    verification: VerificationStatusDTOSchema.optional(),
    lastVerifiedAt: z.string().optional(),
    featured: z.boolean().optional(),
  })
  .strict();

const ListingSummaryDTOSchemaBase = BaseListingDTOSchema.extend({
  shortDescription: z.string().optional(),
  amenityNames: z.array(z.string()).optional(),
});

export const ListingSummaryDTOSchema = ListingSummaryDTOSchemaBase;

export const ListingSummaryDTOArraySchema = z.array(ListingSummaryDTOSchema);

export function parseCityDTO(
  input: unknown
): { ok: true; data: z.infer<typeof CityDTOSchema> } | { ok: false; error: string } {
  const result = CityDTOSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.toString() };
}

export const AmenityDTOSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    icon: z.string().optional(),
    category: z.string().optional(),
  })
  .strict();

export const MoneySchema = z
  .object({
    amount: z.number(),
    currency: z.string(),
    unit: z.enum(['night', 'meal', 'hour']).optional(),
  })
  .strict();

export const CoworkingDetailsSchema = z
  .object({
    pricingPlans: z
      .array(
        z.object({
          type: z.string(),
          price: MoneySchema,
          period: z.string(),
          features: z.array(z.string()).optional(),
        })
      )
      .optional(),
    openingHours: z
      .array(
        z.object({
          day: z.string(),
          opens: z.string(),
          closes: z.string(),
        })
      )
      .optional(),
    internetSpeed: InternetSpeedDTOSchema.optional(),
  })
  .strict();

export const CafeDetailsSchema = z
  .object({
    openingHours: z
      .array(
        z.object({
          day: z.string(),
          opens: z.string(),
          closes: z.string(),
        })
      )
      .optional(),
    priceIndication: z.string().optional(),
    menuHighlights: z.array(z.string()).optional(),
    noiseLevel: z.string().optional(),
    workPolicy: z
      .object({
        laptopsAllowed: z.boolean().optional(),
        timeLimit: z.number().optional(),
      })
      .optional(),
  })
  .strict();

export const RestaurantDetailsSchema = z
  .object({
    cuisineType: z.array(z.string()).optional(),
    operatingHours: z
      .array(
        z.object({
          day: z.string(),
          opens: z.string(),
          closes: z.string(),
        })
      )
      .optional(),
    dietaryOptions: z.array(z.string()).optional(),
    averageMealPrice: MoneySchema.optional(),
  })
  .strict();

export const ActivityDetailsSchema = z
  .object({
    activityType: z.string().optional(),
    duration: z.string().optional(),
    skillLevel: z.string().optional(),
    languages: z.array(z.string()).optional(),
  })
  .strict();

export const AccommodationDetailsSchema = z
  .object({
    accommodationType: z.string().optional(),
    pricePerNight: MoneySchema.optional(),
    roomTypes: z.array(z.string()).optional(),
    minimumStay: z.number().optional(),
  })
  .strict();

export const ListingDetailSharedSchema = BaseListingDTOSchema.extend({
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  galleryImages: z.array(z.string()),
  amenities: z.array(AmenityDTOSchema),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
});

export const ListingDetailDTOSchema = z.union([
  ListingDetailSharedSchema.extend({
    type: z.literal('coworking'),
    coworkingDetails: CoworkingDetailsSchema,
  }),
  ListingDetailSharedSchema.extend({
    type: z.literal('cafe'),
    cafeDetails: CafeDetailsSchema,
  }),
  ListingDetailSharedSchema.extend({
    type: z.literal('restaurant'),
    restaurantDetails: RestaurantDetailsSchema,
  }),
  ListingDetailSharedSchema.extend({
    type: z.literal('activities'),
    activityDetails: ActivityDetailsSchema,
  }),
  ListingDetailSharedSchema.extend({
    type: z.literal('accommodation'),
    accommodationDetails: AccommodationDetailsSchema,
  }),
]);

export const RelatedListingDTOSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    imageUrl: z.string(),
    city: z.string(),
    priceRange: z.enum(['budget', 'moderate', 'premium']),
    ecoFocusTags: z.array(z.string()),
  })
  .strict();

export const ReviewDTOSchema = z
  .object({
    id: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string(),
    user: z.object({
      name: z.string(),
      image: z.string(),
    }),
    createdAt: z.string(),
    status: z.enum(['pending', 'approved', 'rejected', 'changes_needed', 'flagged']),
  })
  .strict();

export function parseCityDetailDTO(
  input: unknown
): { ok: true; data: z.infer<typeof CityDetailDTOSchema> } | { ok: false; error: string } {
  const result = CityDetailDTOSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.toString() };
}

export function parseListingSummaryArray(
  input: unknown
): { ok: true; data: z.infer<typeof ListingSummaryDTOArraySchema> } | { ok: false; error: string } {
  const result = ListingSummaryDTOArraySchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.toString() };
}
