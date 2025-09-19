# Fallback Image System Documentation

## Overview

This project uses a robust fallback image system to ensure users always see meaningful visual content, even when primary images fail to load or are unavailable.

## Critical Files

### `/public/placeholder_image.png`
**⚠️ CRITICAL FILE - DO NOT REMOVE ⚠️**

This file serves as the universal fallback image for the entire application. It is used when:
- Primary images fail to load from external sources (Sanity CDN, Unsplash, etc.)
- Image assets are corrupted or inaccessible
- During development when image services are not available
- For mock data and testing scenarios

**File Specifications:**
- Format: PNG
- Location: `/app-next-directory/public/placeholder_image.png`
- Size: ~13.8KB (reasonable for web delivery)
- Accessible via URL: `/placeholder_image.png`

## Implementation

### Core Fallback Function
The fallback mechanism is implemented in `/src/lib/dto-transformer.ts`:

```typescript
export const FALLBACK_IMAGE = '/placeholder_image.png';

export const imageOrFallback = (img: unknown, w: number, h: number): string => {
  // Try to process the provided image
  // ... image processing logic ...
  
  // Return fallback if all else fails
  return FALLBACK_IMAGE;
}
```

### Usage Throughout Application

The fallback image is used in multiple contexts:

1. **Listing Components:**
   - `VenueCard.tsx` - Venue card displays
   - `ListingGrid.tsx` - Listing grid views
   - `RelatedListings.tsx` - Related listings sections

2. **City Components:**
   - `CityCarousel.tsx` - City showcase carousels
   - City detail mock data

3. **Featured Content:**
   - Featured venues mock data
   - Blog post fallbacks

4. **API Transformations:**
   - DTO transformers use it when converting Sanity data
   - Listing detail page transformations

## Protection Measures

### 1. Automated Tests
The file `/src/__tests__/placeholder-image.test.ts` contains comprehensive tests that:
- Verify the file exists
- Ensure it's readable and properly formatted
- Validate it's a genuine PNG file
- Check file size constraints

### 2. Code Documentation
Critical sections of code include warnings about the importance of this file.

### 3. Git Protection
The `.gitignore` file is configured to ensure this critical asset is never accidentally excluded.

## Troubleshooting

### If placeholder_image.png is accidentally removed:

1. **Immediate symptoms:**
   - Broken image icons throughout the application
   - Failed image loads in development and production
   - Test failures in the test suite

2. **Recovery steps:**
   - Restore the file from git history: `git checkout HEAD~1 -- app-next-directory/public/placeholder_image.png`
   - Or obtain a replacement PNG image and place it at the correct path
   - Run tests to verify: `npm run test:unit -- src/__tests__/placeholder-image.test.ts`

3. **Prevention:**
   - Always run the full test suite before deploying
   - Review file changes carefully during large refactoring
   - Educate team members about critical assets

## Maintenance

### Updating the Placeholder Image
If you need to update the placeholder image:

1. Ensure the new image is a PNG format
2. Keep file size reasonable (< 50KB recommended)
3. Maintain the same filename: `placeholder_image.png`
4. Update this documentation if the image purpose changes
5. Run the test suite to ensure everything still works

### Performance Considerations
- The placeholder image is optimized for quick loading
- It's served directly from the public directory (no processing)
- CDN caching helps with global delivery

## Related Files

- `/src/lib/dto-transformer.ts` - Core fallback logic
- `/src/__tests__/placeholder-image.test.ts` - Protection tests
- Various component files that rely on the fallback system
- Mock data files throughout the application