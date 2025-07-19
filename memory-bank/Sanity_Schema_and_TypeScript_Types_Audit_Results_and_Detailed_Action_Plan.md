# Sanity Schema and TypeScript Types Audit Results and Detailed Action Plan

**Created:** July 20, 2025  
**Purpose:** Comprehensive audit results and step-by-step action plan for Sanity schema and TypeScript types refactoring  
**Target:** Sustainable Digital Nomads Directory project  

---

## Executive Summary

This document provides detailed audit results and actionable steps for refactoring Sanity schemas and TypeScript types to achieve consistency, eliminate legacy cruft, and improve developer experience.

---

## R.1 Audit Results: Field Name Inconsistencies

### Critical Misalignments Found

| Sanity Schema Field | TypeScript Type Field | Impact | Priority |
|-------------------|---------------------|---------|----------|
| `category` | `type` | High - Core field mismatch | P1 |
| `address_string` | `address` | Medium - Data field mismatch | P2 |
| `eco_focus_tags` | `ecoTags` | High - Reference field mismatch | P1 |
| `description_short`/`description_long` | `description` | Medium - Content field structure | P2 |
| `digital_nomad_features` | `digitalNomadFeatures` | Low - Feature field naming | P3 |
| `primaryImage` | `mainImage` | Medium - Asset field mismatch | P2 |
| `source_urls` | `sourceUrls` | Low - Legacy vs camelCase | P3 |

### Legacy Fields in Schema (Not in TS)
- `address` (legacy)
- `descriptionShort` (legacy)  
- `digitalNomadFeatures` (legacy)
- `ecoFocusTags` (legacy)
- `sourceUrls` (legacy)
- `status` (legacy)

### TS Fields Not in Schema
- `rating`
- `website`
- `phone`
- `email`
- `socialLinks`
- `hours`
- `amenities`
- `createdAt`
- `updatedAt`
- `price`
- `coordinates`
- `ecoRating`
- `priceRange`

---

## R.1 Detailed Action Plan: Normalize Field Names

### Step 1: Update Sanity Schema Fields
**File:** `sanity/schemas/listing.js`

```javascript
// Change these field names:
'category' → 'type'
'address_string' → 'address'  
'eco_focus_tags' → 'ecoTags'
'description_short' → 'shortDescription'
'description_long' → 'longDescription'
'digital_nomad_features' → 'digitalNomadFeatures'
'source_urls' → 'sourceUrls'
'primaryImage' → 'mainImage'
'last_verified_date' → 'lastVerifiedDate'
```

### Step 2: Update TypeScript Types
**File:** `app-next-directory/src/types/listing.ts`

```typescript
// Align these fields:
'type' → 'category' (or keep 'type' and update schema)
'description' → split into 'shortDescription' and 'longDescription'
'mainImage' → 'primaryImage' (or update schema to mainImage)
'price_indication' → 'priceIndication'
```

### Step 3: Update GROQ Queries
**Files:** All files using GROQ queries

Search and replace in all GROQ queries:
- `category` → `type`
- `address_string` → `address`
- `eco_focus_tags` → `ecoTags`
- `description_short` → `shortDescription`
- `description_long` → `longDescription`
- `primaryImage` → `mainImage`

### Step 4: Update API Endpoints
**Files:** `app-next-directory/src/app/api/**/*.ts`

Update all API routes that reference the old field names.

### Step 5: Update Frontend Components
**Files:** `app-next-directory/src/components/**/*.tsx`

Update all component references to use new field names.

---

## R.2 Detailed Action Plan: Extract Shared Objects

### Current Category Details in Schema

**Coworking Details:**
- `operating_hours`
- `pricing_plans`
- `specific_amenities_coworking`

**Cafe Details:**
- `operating_hours`
- `price_indication`
- `menu_highlights_cafe`
- `wifi_reliability_notes`

**Accommodation Details:**
- `accommodation_type`
- `price_per_night_thb_range`
- `room_types_available`
- `specific_amenities_accommodation`

### Step 1: Create Shared Object Schemas
**Location:** `sanity/schemas/objects/`

Create separate files:
- `coworkingDetails.js`
- `cafeDetails.js`
- `accommodationDetails.js`
- `restaurantDetails.js`
- `activitiesDetails.js`

### Step 2: Extract Common Fields
Create shared objects for:
- `operatingHours.js` (used by multiple categories)
- `amenities.js` (category-specific amenities)
- `priceRange.js` (flexible pricing structure)

### Step 3: Update Listing Schema
**File:** `sanity/schemas/listing.js`

Replace inline objects with references to shared objects:
```javascript
import coworkingDetails from './objects/coworkingDetails'
import cafeDetails from './objects/cafeDetails'
// ... other imports

// In listing schema:
defineField({
  name: 'coworkingDetails',
  title: 'Coworking Details',
  type: 'coworkingDetails'
})
```

### Step 4: Update TypeScript Types
**File:** `app-next-directory/src/types/listing.ts`

Create shared interfaces and import them:
```typescript
import { CoworkingDetails, CafeDetails } from './details'

export interface CoworkingListing extends Listing {
  type: 'coworking'
  coworkingDetails: CoworkingDetails
}
```

---

## R.3 Detailed Action Plan: Set Up Codegen

### Step 1: Install Codegen Tool
**Location:** `app-next-directory/`

```bash
npm install @sanity/codegen --save-dev
# or
npm install sanity-codegen --save-dev
```

### Step 2: Configure Codegen
**File:** `app-next-directory/codegen.config.js`

```javascript
module.exports = {
  schema: '../sanity/schemas',
  output: './src/types/generated',
  client: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET
  }
}
```

### Step 3: Add Build Scripts
**File:** `app-next-directory/package.json`

```json
{
  "scripts": {
    "codegen": "sanity-codegen",
    "build": "npm run codegen && next build"
  }
}
```

### Step 4: Replace Manual Types
**Files:** All TypeScript files

Replace manual type imports with generated types:
```typescript
// Old:
import { Listing } from '../types/listing'
// New:
import { Listing } from '../types/generated/sanity'
```

---

## R.4 Detailed Action Plan: Define Enums

### Step 1: Update Schema with Enums
**File:** `sanity/schemas/listing.js`

```javascript
defineField({
  name: 'category', // or 'type'
  title: 'Category',
  type: 'string',
  options: {
    list: [
      {title: 'Coworking Space', value: 'coworking'},
      {title: 'Cafe', value: 'cafe'},
      {title: 'Accommodation', value: 'accommodation'},
      {title: 'Restaurant', value: 'restaurant'},
      {title: 'Activities', value: 'activities'}
    ]
  },
  validation: Rule => Rule.required()
})
```

### Step 2: Create TypeScript Enums
**File:** `app-next-directory/src/types/enums.ts`

```typescript
export enum ListingCategory {
  COWORKING = 'coworking',
  CAFE = 'cafe',
  ACCOMMODATION = 'accommodation',
  RESTAURANT = 'restaurant',
  ACTIVITIES = 'activities'
}
```

### Step 3: Update Type Definitions
**File:** `app-next-directory/src/types/listing.ts`

```typescript
import { ListingCategory } from './enums'

export interface Listing {
  category: ListingCategory
  // ... other fields
}
```

---

## R.5 Detailed Action Plan: Centralize Image Model

### Step 1: Create Shared Image Object
**File:** `sanity/schemas/objects/image.js`

```javascript
export default {
  name: 'customImage',
  title: 'Image',
  type: 'object',
  fields: [
    {
      name: 'asset',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true
      }
    },
    {
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string'
    }
  ]
}
```

### Step 2: Update Listing Schema
**File:** `sanity/schemas/listing.js`

```javascript
defineField({
  name: 'mainImage',
  title: 'Main Image',
  type: 'customImage'
}),
defineField({
  name: 'galleryImages',
  title: 'Gallery Images',
  type: 'array',
  of: [{type: 'customImage'}]
})
```

### Step 3: Create TypeScript Image Interface
**File:** `app-next-directory/src/types/image.ts`

```typescript
export interface CustomImage {
  asset: {
    _ref: string
    url: string
  }
  alt: string
  caption?: string
}
```

---

## R.6 Detailed Action Plan: Update API and Frontend

### Step 1: Update GROQ Queries
**Files:** `app-next-directory/src/lib/sanity/queries.ts`

Update all queries to use new field names and structures.

### Step 2: Update API Routes
**Files:** `app-next-directory/src/app/api/**/*.ts`

Update all API endpoints to handle new schema structure.

### Step 3: Update Components
**Files:** `app-next-directory/src/components/**/*.tsx`

Update all components to use new types and field names.

### Step 4: Update Tests
**Files:** `app-next-directory/src/**/*.test.ts`

Update all tests to reflect new schema structure.

---

## R.7 Detailed Action Plan: Migrate Legacy Data

### Step 1: Create Migration Scripts
**File:** `scripts/migrate-legacy-fields.js`

```javascript
// Script to migrate data from legacy fields to new fields
// Example: copy 'address' to 'address_string'
```

### Step 2: Backup Database
```bash
# Create backup before migration
sanity dataset export production backup-$(date +%Y%m%d).tar.gz
```

### Step 3: Run Migration
```bash
# Execute migration script
node scripts/migrate-legacy-fields.js
```

### Step 4: Validate Migration
```bash
# Run validation script to ensure data integrity
node scripts/validate-migration.js
```

### Step 5: Remove Legacy Fields
**File:** `sanity/schemas/listing.js`

Remove all legacy field definitions after successful migration.

---

## R.8 Detailed Action Plan: Validate with Tests

### Step 1: Update Unit Tests
**Files:** `app-next-directory/src/**/*.test.ts`

Update all unit tests to use new types and field names.

### Step 2: Create Integration Tests
**Files:** `app-next-directory/tests/integration/`

Create tests to validate:
- Schema validation
- Type checking
- GROQ query results
- API responses

### Step 3: Create Migration Tests
**Files:** `tests/migration/`

Create tests to validate:
- Data migration success
- No data loss
- Field mapping correctness

### Step 4: Run Full Test Suite
```bash
npm run test
npm run test:integration
npm run test:migration
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Backup Sanity dataset
- [ ] Create feature branch
- [ ] Document current GROQ queries

### R.1 - Field Normalization
- [ ] Update Sanity schema field names
- [ ] Update TypeScript types
- [ ] Update GROQ queries
- [ ] Update API endpoints
- [ ] Update frontend components
- [ ] Run tests

### R.2 - Extract Shared Objects
- [ ] Create shared object schemas
- [ ] Update listing schema to use shared objects
- [ ] Create shared TypeScript interfaces
- [ ] Update imports and references

### R.3 - Setup Codegen
- [ ] Install codegen tool
- [ ] Configure codegen
- [ ] Add build scripts
- [ ] Generate types
- [ ] Replace manual types

### R.4 - Define Enums
- [ ] Add enums to schema
- [ ] Create TypeScript enums
- [ ] Update type definitions
- [ ] Validate enum usage

### R.5 - Centralize Image Model
- [ ] Create shared image object
- [ ] Update schemas to use shared image
- [ ] Create TypeScript image interface
- [ ] Update component usage

### R.6 - Update Code
- [ ] Update GROQ queries
- [ ] Update API routes
- [ ] Update components
- [ ] Update tests

### R.7 - Migrate Data
- [ ] Create migration scripts
- [ ] Backup database
- [ ] Run migration
- [ ] Validate migration
- [ ] Remove legacy fields

### R.8 - Final Validation
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Run migration tests
- [ ] Performance testing
- [ ] User acceptance testing

---

## Risk Mitigation

### High Risk Items
1. **Data Loss During Migration**
   - Mitigation: Full backup before migration
   - Validation: Run data integrity checks

2. **Breaking API Changes**
   - Mitigation: Version API endpoints
   - Testing: Comprehensive integration tests

3. **Frontend Breaking Changes**
   - Mitigation: Update components incrementally
   - Testing: Component testing for all changes

### Medium Risk Items
1. **Type Mismatches**
   - Mitigation: Use codegen for type safety
   - Testing: Strict TypeScript compilation

2. **Query Performance**
   - Mitigation: Optimize GROQ queries
   - Testing: Performance benchmarking

---

## Success Criteria

### Technical Criteria
- [ ] All field names consistent between schema and types
- [ ] No legacy fields remaining
- [ ] All tests passing
- [ ] Type safety maintained
- [ ] No performance degradation

### Quality Criteria
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Developer onboarding time reduced
- [ ] Maintenance complexity reduced

---

*This document serves as the definitive guide for the refactoring process. All changes should be tracked against this checklist for completion verification.*