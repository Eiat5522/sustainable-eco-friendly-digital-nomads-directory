# Dynamic Routes Fix Documentation

## Problem
The Next.js app had conflicting dynamic routes with different parameter names:
- `/city/[city]` vs `/city/[slug]`
- `/listings/[id]` vs `/listings/[slug]`

This was causing build errors where Next.js reported: "You cannot use different slug names for the same dynamic path ('city' !== 'slug')".

## Changes Made

### 1. Renamed conflicting route folders
- Renamed `/app/city/[city]` to `/app/city/_city_bak`
- Renamed `/app/listings/[id]` to `/app/listings/_id_bak`

### 2. Updated all internal references to use consistent parameter names
- Updated `ListingCard` component to use `slug` as the primary identifier for routes
- Updated `CustomMarker` component to use `slug` for links
- Updated `Header` component links to use slug-based routes
- Updated `RelatedListings` component to prioritize using `slug` parameter

### 3. Configuration fixes
- Removed deprecated `serverActions: true` from next.config.mjs
- Created valid root package.json to resolve browser list parsing errors

### 4. Testing
- Created a test script to validate the dynamic routes are working correctly

## Standardization Approach

We standardized on using `[slug]` as the parameter name for all dynamic routes for several reasons:

1. **Semantic Clarity**: Using "slug" clearly indicates the parameter is a URL-friendly identifier
2. **SEO Benefits**: Slug-based URLs are more descriptive and search engine friendly
3. **Consistency**: Having one parameter naming pattern simplifies development and maintenance
4. **Future-Proofing**: Allows for easier migration to different ID systems in the future

## Migration Strategy

We took a methodical approach to this migration:

1. **Preserve Original Code**: Kept the old route handlers by renaming directories
2. **Update References Systematically**: Updated all components that link to routes
3. **Prioritize Slug**: Modified code to prioritize `slug` over `id` when both are available
4. **Test Thoroughly**: Created comprehensive testing scripts

## Preferred Navigation Pattern
After these changes, the preferred route structure is:
- `/listings/[slug]` (e.g., `/listings/eco-friendly-coworking-space`)
- `/city/[slug]` (e.g., `/city/chiang-mai`)
- `/category/[slug]` (e.g., `/category/coworking`)

## Testing
Run the app and verify that the routes are working correctly:

```bash
cd app-next-directory
npm run dev
```

Then in another terminal:
```bash
cd app-next-directory
node scripts/route-test.js
```

Alternatively, use our PowerShell testing script which automatically starts the server, runs tests, and shuts down:

```powershell
.\scripts\run-routes-test.ps1
```

## Future Work

- Consider fully removing the backup implementations after thorough testing
- Implement generateStaticParams for static generation of dynamic routes
- Add more comprehensive testing for edge cases
