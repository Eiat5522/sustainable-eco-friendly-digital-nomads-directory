---
applyTo: '.copilot-tracking/changes/20260103-validate-cachelife-profiles-nextjs16-changes.md'
---
<!-- markdownlint-disable-file -->
# Task Checklist: Validate cacheLife Profiles in Next.js 16

## Overview
Validate that the updated cacheLife profiles in next.config.mjs work correctly with Next.js 16, including testing revalidateTag usage and ensuring no runtime errors.

## Objectives
- Verify Next.js 16 builds successfully with cacheLife configuration
- Create and test cached functions using each cacheLife profile (instant, short, medium, long)
- Test revalidateTag functionality with different profiles
- Ensure no runtime errors occur during cache operations
- Validate cache behavior in development environment

## Research Summary

### Project Files
- app-next-directory/next.config.mjs - Contains cacheLife profiles and cacheComponents: true
- app-next-directory/package.json - Next.js 16.1.0 dependency

### External References
- #file:../research/20260103-validate-cachelife-profiles-nextjs16-research.md - Complete research on cacheLife and revalidateTag
- #fetch:https://nextjs.org/docs/app/api-reference/next-config-js/cacheLife - Official cacheLife documentation
- #fetch:https://nextjs.org/docs/app/api-reference/functions/revalidateTag - Official revalidateTag documentation

### Standards References
- #file:../../.github/copilot-instructions.md - Project conventions and testing guidelines

## Implementation Checklist

### [ ] Phase 1: Setup Test Environment

- [ ] Task 1.1: Create test directory structure for cache validation
  - Details: .copilot-tracking/details/20260103-validate-cachelife-profiles-nextjs16-details.md (Lines 1-10)

- [ ] Task 1.2: Verify build configuration and dependencies
  - Details: .copilot-tracking/details/20260103-validate-cachelife-profiles-nextjs16-details.md (Lines 11-20)

### [ ] Phase 2: Create Cache Test Functions

- [ ] Task 2.1: Implement cached functions for each profile (instant, short, medium, long)
  - Details: .copilot-tracking/details/20260103-validate-cachelife-profiles-nextjs16-details.md (Lines 21-40)

- [ ] Task 2.2: Create tagged cache functions with cacheTag
  - Details: .copilot-tracking/details/20260103-validate-cachelife-profiles-nextjs16-details.md (Lines 41-50)

### [ ] Phase 3: Test Revalidation

- [ ] Task 3.1: Implement revalidateTag functions for different profiles
  - Details: .copilot-tracking/details/20260103-validate-cachelife-profiles-nextjs16-details.md (Lines 51-60)

- [ ] Task 3.2: Create test route handlers for revalidation
  - Details: .copilot-tracking/details/20260103-validate-cachelife-profiles-nextjs16-details.md (Lines 61-70)

### [ ] Phase 4: Runtime Validation

- [ ] Task 4.1: Build application and verify no compilation errors
  - Details: .copilot-tracking/details/20260103-validate-cachelife-profiles-nextjs16-details.md (Lines 71-80)

- [ ] Task 4.2: Test cache functions in development environment
  - Details: .copilot-tracking/details/20260103-validate-cachelife-profiles-nextjs16-details.md (Lines 81-90)

- [ ] Task 4.3: Validate revalidation behavior and error handling
  - Details: .copilot-tracking/details/20260103-validate-cachelife-profiles-nextjs16-details.md (Lines 91-100)

## Dependencies
- Next.js 16.1.0
- cacheComponents: true in next.config.mjs
- Node.js environment for testing

## Success Criteria
- Application builds successfully with cacheLife configuration
- All cache profiles (instant, short, medium, long) work without errors
- revalidateTag functions execute without runtime errors
- Cache behavior matches expected stale/revalidate/expire timings
- No console errors or warnings related to cache functionality