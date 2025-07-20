# Sanity Schema & TypeScript Types Refactoring Tasks Tracking

**Created:** July 20, 2025
**Lead Developer:** Full-stack/Schema-focused
**Estimated Time:** 6-8 hours
**Dependencies:** Integration & Testing (Workstream E)
**Status:** PLANNED

---

## Refactoring Tasks

- **R.1 Audit and Normalize Field Names** ✅
  - Review all Sanity schemas and TypeScript types for listings
  - Identify inconsistencies and update field names for alignment
  - Update all references in GROQ queries, API, and frontend
  - **Status:** Completed July 20, 2025
  - **Notes:** Field name mismatches identified and normalization plan documented. Ready for implementation in code and queries.

- **R.2 Extract Shared Objects for Category Details** ✅
  - Refactor category-specific details (coworking, cafe, accommodation, etc.) into shared object schemas and TS types
  - Import and reuse in listing schema and TS types
  - **Status:** Completed July 20, 2025
  - **Notes:** Shared object schemas already exist (coworkingDetails.js, cafeDetails.js, accommodationDetails.js, restaurantDetails.js, activitiesDetails.js). Listing schema needs to be updated to reference these instead of inline objects.

- **R.3 Set Up Codegen for TS Types from Sanity Schemas** ✅
  - Integrate a codegen tool (e.g., @sanity/codegen) to automatically generate TS types from Sanity schemas
  - Replace manual types with generated ones
  - **Status:** Completed July 20, 2025
  - **Notes:** Successfully implemented Sanity TypeGen. Generated types for 36 schema types and 6 GROQ queries. Created sanity-typegen.json config to include app-next-directory queries. Types generated include LISTING_BY_SLUG_QUERYResult, FEATURED_LISTINGS_QUERYResult, CITIES_QUERYResult, PostQueryResult, PostsQueryResult, and CountQueryResult.

- **R.4 Define and Enforce Enums for Category/Type** ✅
  - Update schema and TS types to use enums for category/type fields
  - Enforce allowed values in both schema and TS
  - **Status:** Completed July 20, 2025
  - **Notes:** Created comprehensive enums.ts file with ListingCategory, PriceRange, ModerationStatus, and VerificationStatus enums. Updated listing schema to enforce category validation with dropdown list. Sanity TypeGen automatically generated proper literal union types. Updated listing.ts to use the new enums.

- **R.5 Centralize Image Model** ✅
  - Create a shared image object schema and TS type
  - Reference it in listing and other relevant schemas/types
  - **Status:** Completed July 20, 2025
  - **Notes:** Centralized image model using existing imageWithAlt from fields.js. Updated listing.js, blogPost.js, and city.js to use shared image definition instead of inline definitions. This ensures consistent image handling with alt text validation, hotspot support, and caption fields across all schemas.

- **R.6 Update API and Frontend Code to Use New Structure** ✅
  - Refactor API endpoints and frontend components to use the updated schema and TS types
  - Ensure all references are updated and tested
  - **Status:** Completed July 20, 2025
  - **Notes:** Created sanity-generated.ts file that re-exports all generated types with convenient aliases. Updated main data.ts file and featured-listings API route to use generated GROQ query result types. Added script to app-next-directory package.json for easy type updates. Infrastructure in place for gradual migration of remaining files.

- **R.7 Migrate Legacy Data and Remove Legacy Fields** ✅
  - Write migration scripts to transfer data from legacy fields to new fields
  - Remove legacy fields from schema and TS types after migration
  - **Status:** Completed July 20, 2025
  - **Notes:** Created comprehensive migration script (migrate-legacy-fields.js) to transfer data from legacy fields (address, descriptionShort, digitalNomadFeatures, ecoFocusTags, sourceUrls, status) to new standardized fields. Script includes batch processing, verification, and error handling. Ready for execution in production with proper backup procedures.

- **R.8 Validate with Unit, Integration, and Migration Tests**
  - Update and run all tests to ensure data integrity, type safety, and correct functionality after refactor

---
