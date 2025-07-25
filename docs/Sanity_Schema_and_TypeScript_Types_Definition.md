# Sanity Schema and TypeScript Types Definition

## Overview

This document provides a comprehensive overview of the refactored Sanity CMS schema definitions and TypeScript types for the Sustainable Digital Nomads Directory project. All schema files have been migrated to use consistent **camelCase** naming conventions for documents, objects, and fields.

## Migration Summary

### Completed Schema Refactoring

All schema files in `sanity/schemas/` have been successfully refactored to use camelCase naming:

- ✅ `listing.js` - Main listing document schema
- ✅ `accommodationDetails.js` - Accommodation-specific fields
- ✅ `activitiesDetails.js` - Activity-specific fields
- ✅ `address.js` - Address object schema
- ✅ `amenities.js` - Amenities object schema
- ✅ `blogPost.js` - Blog post document schema
- ✅ `cafeDetails.js` - Cafe-specific fields
- ✅ `city.js` - City document schema
- ✅ `comment.js` - Comment document schema
- ✅ `coworkingDetails.js` - Coworking space-specific fields
- ✅ `ecoInitiatives.js` - Eco initiatives object schema
- ✅ `ecoTag.js` - Eco tag document schema
- ✅ `event.js` - Event document schema
- ✅ `eventRegistration.js` - Event registration document schema
- ✅ `fields.js` - Shared field definitions
- ✅ `listingAnalytics.js` - Analytics document schema
- ✅ `moderationStatus.js` - Moderation status document schema
- ✅ `nomadFeature.js` - Digital nomad feature document schema
- ✅ `restaurantDetails.js` - Restaurant-specific fields
- ✅ `review.js` - Review document schema
- ✅ `richText.js` - Rich text object schema
- ✅ `searchBoost.js` - Search boost configuration schema
- ✅ `searchConfig.js` - Search configuration document schema
- ✅ `user.js` - User document schema
- ✅ `userPreference.js` - User preference document schema

### Key Field Name Changes

#### Core Listing Schema (`listing.js`)
- `eco_notes_detailed` → `ecoNotesDetailed`
- `coworking_details` → `coworkingDetails`
- `cafe_details` → `cafeDetails`
- `accommodation_details` → `accommodationDetails`
- `search_metadata` → `searchMetadata`
- `eco_details` → `ecoDetails`

#### Accommodation Details (`accommodationDetails.js`)
- `accommodation_type` → `accommodationType`
- `price_range_thb` → `priceRangeThb`
- `room_types_available` → `roomTypesAvailable`
- `minimum_stay` → `minimumStay`
- `coworking_partnership` → `coworkingPartnership`
- `workspace_quality` → `workspaceQuality`
- `stay_duration` → `stayDuration`

#### Activity Details (`activitiesDetails.js`)
- `activity_type` → `activityType`
- `price_per_person` → `pricePerPerson`
- `group_size` → `groupSize`
- `sustainability_practices` → `sustainabilityPractices`
- `skill_level` → `skillLevel`
- `eco_score` → `ecoScore`

#### Cafe Details (`cafeDetails.js`)
- `operating_hours` → `operatingHours`
- `price_indication` → `priceIndication`
- `menu_highlights` → `menuHighlights`
- `workspace_amenities` → `workspaceAmenities`
- `max_recommended_stay` → `maxRecommendedStay`
- `noise_level` → `noiseLevel`
- `power_outlets` → `powerOutlets`
- `work_policy` → `workPolicy`
- `vegan_friendly` → `veganFriendly`

#### Restaurant Details (`restaurantDetails.js`)
- `cuisine_type` → `cuisineType`
- `price_range` → `priceRange`
- `operating_hours` → `operatingHours`
- `sustainability_initiatives` → `sustainabilityInitiatives`
- `dietary_options` → `dietaryOptions`
- `work_friendly` → `workFriendly`
- `average_meal_price_thb` → `averageMealPriceThb`

## Schema Definitions

### Document Schemas

#### 1. Listing Document
**Type:** `listing`
**Purpose:** Main content type for all sustainable venues and services

**Key Fields:**
```javascript
{
  name: string
  slug: slug
  city: reference(city)
  type: 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities'
  address: string
  location: geopoint
  shortDescription: string
  longDescription: text
  ecoTags: array<reference(ecoTag)>
  ecoNotesDetailed: text
  mainImage: image
  galleryImages: array<image>
  digitalNomadFeatures: array<string>
  lastVerifiedDate: date
  
  // Type-specific details
  coworkingDetails: object(coworkingDetails)
  cafeDetails: object(cafeDetails)
  accommodationDetails: object(accommodationDetails)
  
  // Metadata
  searchMetadata: object
  ecoDetails: object
  moderationStatus: string
  verificationStatus: string
}
```

#### 2. City Document
**Type:** `city`
**Purpose:** City information for location-based filtering

**Key Fields:**
```javascript
{
  name: string
  slug: slug
  country: string
  description: text
  sustainabilityScore: number
  highlights: array<string>
  mainImage: image
}
```

#### 3. User Document
**Type:** `user`
**Purpose:** User profiles and authentication

**Key Fields:**
```javascript
{
  name: string
  email: string
  avatar: image
  bio: text
  role: 'user' | 'editor' | 'venueOwner' | 'admin'
  ownedListings: array<reference(listing)>
  reviews: array<reference(review)>
  lastActive: datetime
  createdAt: datetime
}
```

### Object Schemas

#### 1. Accommodation Details
**Type:** `accommodationDetails`
**Purpose:** Detailed accommodation information

**Key Fields:**
```javascript
{
  accommodationType: string
  priceRangeThb: { min: number, max: number }
  roomTypesAvailable: array<object>
  minimumStay: number
  coworkingPartnership: object
  workspaceQuality: object
  stayDuration: object
}
```

#### 2. Activity Details
**Type:** `activitiesDetails`
**Purpose:** Activity and experience information

**Key Fields:**
```javascript
{
  activityType: string
  pricePerPerson: { min: number, max: number }
  duration: { value: number, unit: string }
  groupSize: { min: number, max: number }
  sustainabilityPractices: array<string>
  skillLevel: string
  ecoScore: object
  languages: array<string>
  accessibility: object
  seasonality: object
}
```

#### 3. Cafe Details
**Type:** `cafeDetails`
**Purpose:** Cafe-specific information

**Key Fields:**
```javascript
{
  operatingHours: array<object>
  priceIndication: string
  menuHighlights: array<string>
  workspaceAmenities: array<string>
  maxRecommendedStay: number
  noiseLevel: string
  powerOutlets: object
  workPolicy: object
  veganFriendly: object
}
```

#### 4. Restaurant Details
**Type:** `restaurantDetails`
**Purpose:** Restaurant-specific information

**Key Fields:**
```javascript
{
  cuisineType: array<string>
  priceRange: string
  operatingHours: string
  sustainabilityInitiatives: array<string>
  dietaryOptions: array<string>
  seating: array<string>
  workFriendly: array<string>
  averageMealPriceThb: { min: number, max: number }
}
```

## TypeScript Type Generation

### Generated Types Location
- **Sanity Types:** `sanity/sanity.types.ts`
- **App Types:** `app-next-directory/src/types/sanity-generated.ts`

### Type Generation Command
```bash
# Generate Sanity types
npx sanity typegen generate

# Update app types (if needed)
npx sanity typegen generate --out-dir=../app-next-directory/src/types/
```

### Example Generated Types
```typescript
export interface Listing extends SanityDocument {
  _type: 'listing'
  name?: string
  slug?: Slug
  city?: Reference
  type?: 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities'
  address?: string
  location?: Geopoint
  shortDescription?: string
  longDescription?: string
  ecoTags?: Array<Reference>
  ecoNotesDetailed?: string
  mainImage?: ImageAsset
  galleryImages?: Array<ImageAsset>
  digitalNomadFeatures?: Array<string>
  lastVerifiedDate?: string
  coworkingDetails?: CoworkingDetails
  cafeDetails?: CafeDetails
  accommodationDetails?: AccommodationDetails
  searchMetadata?: SearchMetadata
  ecoDetails?: EcoDetails
  moderationStatus?: string
  verificationStatus?: string
}

export interface AccommodationDetails {
  _type: 'accommodationDetails'
  accommodationType?: string
  priceRangeThb?: {
    min?: number
    max?: number
  }
  roomTypesAvailable?: Array<{
    type?: string
    pricePerNight?: number
    features?: Array<string>
  }>
  minimumStay?: number
  coworkingPartnership?: {
    hasPartnership?: boolean
    partner?: Reference
    discountDetails?: string
  }
  workspaceQuality?: {
    hasWorkspace?: boolean
    workspaceType?: string
    workspaceFeatures?: Array<string>
  }
  stayDuration?: {
    minimumNights?: number
    maximumNights?: number
    longTermAvailable?: boolean
    longTermDiscount?: string
  }
}
```

## Testing and Validation

### Schema Validation
All schemas include comprehensive validation rules:
- Required fields validation
- Min/max value constraints
- Format validation (email, URL, etc.)
- Custom validation logic

### Type Testing
TypeScript types are tested in:
- `app-next-directory/src/tests/sanity-generated-types.test.ts`

### Example Test Cases
```typescript
describe('Sanity Generated Types', () => {
  it('should have proper Listing type structure', () => {
    const mockListing: Listing = {
      _id: 'test-id',
      _type: 'listing',
      name: 'Test Listing',
      type: 'coworking',
      accommodationDetails: {
        accommodationType: 'hotel',
        priceRangeThb: { min: 1000, max: 3000 }
      }
    }
    
    expect(mockListing.name).toBe('Test Listing')
    expect(mockListing.accommodationDetails?.accommodationType).toBe('hotel')
  })
})
```

## Migration Impact

### Benefits Achieved
1. **Consistency:** All field names now use camelCase
2. **Developer Experience:** Improved IntelliSense and type safety
3. **Maintainability:** Easier to read and understand
4. **Standards Compliance:** Follows JavaScript/TypeScript conventions

### Breaking Changes
- All API responses will now use camelCase field names
- Frontend components need to be updated to use new field names
- Database queries (GROQ) need to be updated

### Migration Checklist
- ✅ Schema files refactored
- ⚠️ Update TypeScript types (run `npx sanity typegen generate`)
- ⚠️ Update frontend components
- ⚠️ Update API routes
- ⚠️ Update tests
- ⚠️ Update documentation

## Next Steps

1. **Regenerate Types:** Run type generation to update TypeScript definitions
2. **Update Components:** Refactor React components to use new field names
3. **Update API Routes:** Update all API endpoints to use camelCase
4. **Update Tests:** Update test files to match new schema structure
5. **Verify Data Migration:** Ensure existing data works with new schema

## Notes

- All schema changes are backward compatible at the database level
- The actual data structure in Sanity remains unchanged
- Only the schema definitions have been updated to use camelCase
- Type generation will create new TypeScript interfaces matching the camelCase schema

---

**Generated:** January 25, 2025  
**Last Updated:** January 25, 2025  
**Status:** Schema Refactoring Complete ✅