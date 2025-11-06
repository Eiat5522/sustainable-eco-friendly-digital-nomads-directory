# Sanity Schema Relationships Documentation

## Core Document Types and Their Relationships

### 1. Listing (Central Entity)
- **References:**
  - City (one-to-one)
  - EcoTags (many-to-many)
  - NomadFeatures (many-to-many)
- **Referenced By:**
  - Reviews (one-to-many)
  - Events (one-to-many)
  - ListingAnalytics (one-to-one)
  - User.ownedListings (many-to-one)
- **Conditional Fields:**
  - coworkingDetails (when type = 'coworking')
  - cafeDetails (when type = 'cafe')
  - accommodationDetails (when type = 'accommodation')
  - restaurantDetails (when type = 'restaurant')
  - activitiesDetails (when type = 'activity')

### 2. User
- **References:**
  - ownedListings (many-to-many → Listing)
  - reviews (one-to-many → Review)
- **Referenced By:**
  - UserPreference (one-to-one)
  - BlogPost (one-to-many)
  - EventRegistration (one-to-many)
  - Review (many-to-one)

### 3. City
- **Referenced By:**
  - Listing (one-to-many)
  - Event (one-to-many)
  - UserPreference.preferredCities (many-to-many)

### 4. Review
- **References:**
  - Listing (many-to-one)
  - User (many-to-one)

### 5. Event
- **References:**
  - Listing (venue, many-to-one)
  - City (many-to-one)
- **Referenced By:**
  - EventRegistration (one-to-many)

### 6. BlogPost
- **References:**
  - User (author, many-to-one)
- **Referenced By:**
  - Comment (one-to-many)

## Category-Specific Object Types

### 1. CoworkingDetails
```typescript
{
  amenities: string[]
  internetSpeed: {
    download: number
    upload: number
    lastTested: datetime
  }
  pricingPlans: Array<{
    type: string
    price: number
    currency: string
    per: string
  }>
  events: Reference[] // → Event
}
```

### 2. CafeDetails
```typescript
{
  menuHighlights: string[]
  workPolicy: {
    laptopsAllowed: boolean
    timeLimit?: number
    peakHoursPolicy: string
  }
  powerOutlets: string
  veganFriendly: {
    isVeganFriendly: boolean
    veganOptions: number // percentage
  }
}
```

### 3. AccommodationDetails
```typescript
{
  roomTypes: string[]
  pricing: {
    perNight: number
    currency: string
    discounts?: {
      weekly?: number
      monthly?: number
    }
  }
  accessibility: {
    wheelchairAccessible: boolean
    hasElevator: boolean
    accessibilityNotes?: string
  }
  seasonality: {
    peakSeasons: string[]
    offPeakDiscount?: number
  }
}
```

### 4. RestaurantDetails
```typescript
{
  cuisineType: string[]
  dietaryOptions: {
    vegetarian: boolean
    vegan: boolean
    glutenFree: boolean
    halal: boolean
  }
  pricing: {
    priceRange: string // '$' to '$$$$'
    averageMeal: number
    currency: string
  }
}
```

### 5. ActivitiesDetails
```typescript
{
  activityType: string
  duration: {
    value: number
    unit: 'hours' | 'days'
  }
  groupSize: {
    min: number
    max: number
  }
  ecoScore: {
    score: number
    certifications: string[]
    justification: string
  }
}
```

## Validation Rules and Constraints

1. **Required References:**
   - Listing must have a City reference
   - Review must have both User and Listing references
   - EventRegistration must have both User and Event references

2. **Unique Constraints:**
   - User.email must be unique
   - Listing.slug must be unique
   - BlogPost.slug must be unique

3. **Conditional Requirements:**
   - Category-specific details are required based on Listing.type
   - Image alt text is required for all image fields
   - Coordinates are required for City and Listing locations

4. **Business Rules:**
   - Only users with role 'venueOwner' can have ownedListings
   - Reviews can only be created by authenticated users
   - Events must have a future startDate

## Data Integrity Rules

1. **Cascading Deletes:**
   - When a Listing is deleted:
     - Remove associated Reviews
     - Remove from User.ownedListings
     - Remove associated ListingAnalytics
     - Set associated Events venue to null

2. **Reference Protection:**
   - Cannot delete City if referenced by any Listing
   - Cannot delete User if they own any Listings

3. **Soft Deletes:**
   - Listings implement soft delete with status field
   - Users implement soft delete with status field

## Performance Considerations

1. **Indexes:**
   - City._id (for Listing lookups)
   - User.email (for authentication)
   - Listing.slug (for URL routing)
   - Review.listing._ref (for listing reviews)

2. **Denormalization:**
   - Store review count and average rating on Listing
   - Store user name with EventRegistration
   - Store city name with Listing
