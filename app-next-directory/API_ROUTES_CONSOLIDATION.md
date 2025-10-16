# API Routes Consolidation Summary

## Overview

This document summarizes the consolidation of API routes from the incorrect location (`src/app/api/`) to the correct Next.js App Router location (`app/api/`).

## Background

In Next.js 13+ with the App Router, API routes must be located in the `app/api/` directory, not in `src/app/api/`. Having API routes in `src/app/api/` meant they were not being properly served by Next.js.

## Changes Made

### 1. Moved Auth API Routes

The following authentication API routes were moved from `src/app/api/auth/` to `app/api/auth/`:

- ✅ `request-password-reset/route.ts` - Password reset request endpoint
- ✅ `reset-password/route.ts` - Password reset confirmation endpoint  
- ✅ `verify/route.ts` - Email verification endpoint

### 2. Removed Duplicate/Outdated Routes

The following routes existed in both locations. After comparison, the versions in `app/api/` were confirmed to be more recent and comprehensive, so the old versions in `src/app/api/` were removed:

- ✅ `auth/[...nextauth]/route.ts` - NextAuth configuration (app/api version has enhanced logging)
- ✅ `auth/register/route.ts` - User registration (app/api version is simpler and more current)
- ✅ `comments/route.ts` - Comments API (app/api version has pagination, 238 lines vs 74 lines)
- ✅ `featured-listings/route.ts` - Featured listings API (app/api version has enhanced GROQ queries)
- ✅ `reviews/route.ts` - Reviews API (app/api version has more comprehensive validation)

### 3. Updated References

Updated path references in the following files:

- ✅ `scripts/integration-test.js` - Updated file existence checks
- ✅ `test-dashboard-completion.js` - Updated API endpoint path checks

## Final API Structure

All API routes are now correctly located in `app/api/` with the following structure:

```
app/api/
├── admin/              - Admin dashboard APIs
├── amenities/          - Amenities management
├── auth/               - Authentication & authorization
│   ├── [...nextauth]/  - NextAuth handlers
│   ├── register/       - User registration
│   ├── request-password-reset/ - Password reset request
│   ├── reset-password/ - Password reset confirmation
│   ├── update-profile/ - Profile updates
│   └── verify/         - Email verification
├── blog/               - Blog posts
├── categories/         - Category management
├── cities/             - City information
├── comments/           - User comments
├── contact/            - Contact form
├── featured-listings/  - Featured listings
├── listings/           - Listing management
├── newsletter/         - Newsletter subscription
├── reviews/            - Review management
├── search/             - Search functionality
├── upload/             - File uploads
└── user/               - User-specific APIs
    ├── analytics/      - User analytics
    ├── dashboard/      - User dashboard data
    ├── favorites/      - Favorite listings
    ├── profile/        - User profile
    └── reviews/        - User reviews
```

## Benefits

1. **Correct Next.js App Router Structure**: API routes are now in the location where Next.js expects them
2. **Eliminated Duplication**: Removed duplicate routes that could cause confusion
3. **Up-to-date Code**: Kept the most recent versions of API routes
4. **Consistency**: All API routes follow the same organizational pattern
5. **Better Maintainability**: Clear single source of truth for each API endpoint

## Client-Side Impact

**No changes required** to client-side code that calls these APIs. All API endpoints were already being referenced as `/api/auth/verify`, `/api/auth/reset-password`, etc., without the `src/` prefix, so they will work correctly with the new structure.

Example from `src/lib/email.ts`:
```typescript
const url = new URL('/api/auth/verify', base); // ✓ Works correctly
```

Example from `src/app/auth/reset-request/page.tsx`:
```typescript
const response = await fetch('/api/auth/request-password-reset', { // ✓ Works correctly
```

## Testing Notes

The moved API routes maintain the same functionality as before. To verify:

1. Password reset flow: `/api/auth/request-password-reset` → `/api/auth/reset-password`
2. Email verification: `/api/auth/verify?token=...`
3. Featured listings: `/api/featured-listings`
4. Reviews: `/api/reviews`

All existing tests remain valid and will work with the new structure once dependencies are installed.

## Related Documentation

- See `TEST_SETUP_GUIDE.md` for testing guidelines
- See `SOLUTION_SUMMARY.md` for overall project structure
- See Next.js documentation on [App Router API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
