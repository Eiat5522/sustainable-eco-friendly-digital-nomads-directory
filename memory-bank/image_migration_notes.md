# Image Migration Notes

## Temporary Dual-Location Image Handling (2025-05-22)

The current migration script (scripts/migrate_listings_to_sanity.py) implements a temporary dual-location strategy for handling images:

1. **Primary Location**: sanity_image_staging/
   - Will contain manually curated images
   - Expected to be populated on 2025-05-23
   - Will be the final source of truth for all listing images

2. **Fallback Location**: pp-scaffold/public/images/
   - Contains some initial development images
   - Used temporarily to allow development to proceed
   - Will be phased out after manual image curation is complete

### TODO (2025-05-23)

After manual image curation is complete:

1. Remove the fallback image location logic
2. Update the migration script to only use sanity_image_staging/
3. Remove temporary dual-location handling code (marked with TODO comments)
4. Update this documentation to reflect the final image handling strategy

### Image Sources

Image sources and paths are documented in:
- listings/image_curation_helper.csv

This file contains the mapping between listings and their images, including both local paths and external URLs that need to be downloaded and processed.

### Code Locations

The temporary dual-location handling is implemented in:

1. **Path Constants** (top of file):
   \\\python
   IMAGE_STAGING_PATH = PROJECT_ROOT / "sanity_image_staging"
   PUBLIC_IMAGES_PATH = PROJECT_ROOT / "app-scaffold" / "public"
   \\\

2. **Image Finding Function**:
   \\\python
   def find_image_path(relative_path: str) -> Optional[Path]:
       # Checks both staging and public directories
       # Will be removed after manual curation
   \\\

3. **Main Processing Loop**:
   - Uses the dual-location strategy for both main images and gallery images
   - Provides clear console output about which locations were checked

Look for TEMPORARY IMAGE HANDLING comments in the code for all related sections.
