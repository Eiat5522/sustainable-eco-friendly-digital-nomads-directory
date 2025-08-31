// Runtime validation schemas for DTOs
// File: src/types/dto-schemas.ts

import { z } from 'zod';

// Shared primitives
export const GeoPointSchema = z
  .object({ lat: z.number(), lng: z.number() })
  .strict();

export const ImageDimensionsDTOSchema = z
  .object({ width: z.number().optional(), height: z.number().optional() })
  .partial()
  .strict();

// CityDTO schema
export const CityDTOSchema = z
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

// CityDetailDTO schema (extends CityDTO with additional fields)
export const CityDetailDTOSchema = CityDTOSchema.extend({
  shortDescription: z.string().optional(),
  airQuality: z.string().optional(),
  internetSpeed: z.number().nonnegative().optional(),
  costOfLiving: z.string().optional(),
  climate: z.string().optional(),
  safety: z.string().optional(),
  walkability: z.string().optional(),
  sustainabilityInitiatives: z.array(z.string()).optional(),
  digitalNomadFeatures: z.array(z.string()).optional(),
  galleryImages: z.array(z.string().url()).optional(),
  // Use the same field name as listings
  location: GeoPointSchema.optional(),
}).strict();

// Enums
export const ListingStatusDTOSchema = z.enum([
  'draft',
  'pending',
  'published',
  'archived',
  'flagged',
]);

export const VerificationStatusDTOSchema = z.enum([
  'unverified',
  'verified',
  'needs_verification',
]);

// BaseListingDTO
export const BaseListingDTOSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(['coworking', 'cafe', 'accommodation', 'restaurant', 'activities']),
    city: CityDTOSchema.nullable(),
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

// ListingSummaryDTO schema
export const ListingSummaryDTOSchema = BaseListingDTOSchema.extend({
  shortDescription: z.string().optional(),
  amenityNames: z.array(z.string()).optional(),
});

export const ListingSummaryDTOArraySchema = z.array(ListingSummaryDTOSchema);

// Helper parse functions with safe defaults
export function parseCityDTO(input: unknown): { ok: true; data: z.infer<typeof CityDTOSchema> } | { ok: false; error: string } {
  const result = CityDTOSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.toString() };
}

export function parseCityDetailDTO(input: unknown): { ok: true; data: z.infer<typeof CityDetailDTOSchema> } | { ok: false; error: string } {
  const result = CityDetailDTOSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.toString() };
}

export function parseListingSummaryArray(input: unknown): {
  ok: true;
  data: z.infer<typeof ListingSummaryDTOArraySchema>;
} | { ok: false; error: string } {
  const result = ListingSummaryDTOArraySchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.toString() };
}
