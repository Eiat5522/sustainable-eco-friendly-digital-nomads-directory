import * as z from 'zod';

export const listingFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  type: z.enum(['coworking', 'cafe', 'accommodation', 'restaurant', 'activities']),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  website: z.string().url().optional(),
  city: z.string().min(1, 'City is required'),
  ecoFocusTags: z.array(z.string()).optional(),
  digitalNomadFeatures: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  accommodationDetails: z
    .object({
      accommodationType: z.string().optional(),
      pricePerNightThb: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      roomTypesAvailable: z
        .array(
          z.object({
            type: z.string(),
            pricePerNight: z.number(),
            features: z.array(z.string()).optional(),
          })
        )
        .optional(),
      minimumStay: z.number().optional(),
    })
    .optional(),
  activitiesDetails: z
    .object({
      activityType: z.string().optional(),
      pricePerPerson: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      duration: z
        .object({
          value: z.number().optional(),
          unit: z.string().optional(),
        })
        .optional(),
      groupSize: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      sustainabilityPractices: z.array(z.string()).optional(),
      skillLevel: z.string().optional(),
      languages: z.array(z.string()).optional(),
    })
    .optional(),
  cafeDetails: z
    .object({
      priceIndication: z.string().optional(),
      menuHighlights: z.array(z.string()).optional(),
      workspaceAmenities: z.array(z.string()).optional(),
      maxRecommendedStay: z.number().optional(),
      noiseLevel: z.string().optional(),
    })
    .optional(),
  coworkingDetails: z
    .object({
      pricingPlans: z
        .array(
          z.object({
            type: z.string(),
            price: z.number(),
            period: z.string(),
          })
        )
        .optional(),
      internetSpeed: z
        .object({
          download: z.number().optional(),
          upload: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  restaurantDetails: z
    .object({
      cuisineType: z.array(z.string()).optional(),
      priceRange: z.string().optional(),
      operatingHours: z.string().optional(),
      sustainabilityInitiatives: z.array(z.string()).optional(),
      dietaryOptions: z.array(z.string()).optional(),
      seating: z.array(z.string()).optional(),
      workFriendly: z.array(z.string()).optional(),
      averageMealPriceThb: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;
export type VenueListingFormValues = ListingFormValues;

export function isListingFormValues(value: unknown): value is ListingFormValues {
  return listingFormSchema.safeParse(value).success;
}
