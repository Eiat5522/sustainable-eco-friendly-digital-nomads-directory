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

- **R.2 Extract Shared Objects for Category Details**
  - Refactor category-specific details (coworking, cafe, accommodation, etc.) into shared object schemas and TS types
  - Import and reuse in listing schema and TS types

- **R.3 Set Up Codegen for TS Types from Sanity Schemas**
  - Integrate a codegen tool (e.g., @sanity/codegen) to automatically generate TS types from Sanity schemas
  - Replace manual types with generated ones

- **R.4 Define and Enforce Enums for Category/Type**
  - Update schema and TS types to use enums for category/type fields
  - Enforce allowed values in both schema and TS

- **R.5 Centralize Image Model**
  - Create a shared image object schema and TS type
  - Reference it in listing and other relevant schemas/types

- **R.6 Update API and Frontend Code to Use New Structure**
  - Refactor API endpoints and frontend components to use the updated schema and TS types
  - Ensure all references are updated and tested

- **R.7 Migrate Legacy Data and Remove Legacy Fields**
  - Write migration scripts to transfer data from legacy fields to new fields
  - Remove legacy fields from schema and TS types after migration

- **R.8 Validate with Unit, Integration, and Migration Tests**
  - Update and run all tests to ensure data integrity, type safety, and correct functionality after refactor

---
