# Listings Data Processing Workflow

## Overview

This document outlines the workflow for processing and managing listings data in the Sustainable Digital Nomads Directory project.

## Directory Structure

```
listings/
├── Temp_Listings.json       # New/updated listings to be processed
├── Listings.json           # Existing listings database
├── production/
│   └── Listing_Population_Template.csv   # Final processed output
├── archived-production/
│   └── Listing_Population_Template_{YYYY-MM-DD}_{HHMMSS}.csv  # Archived versions
└── archived-processed/
    └── {YYYY-MM-DD}-{HHMMSS}-Archived-Processed-Listings/
        ├── Temp_Listings.json
        └── Listings.json
```

## Workflow Steps

1. **Data Input**
   - New listings are added to `Temp_Listings.json`
   - Existing listings are maintained in `Listings.json`
   - Both files use the same JSON schema format

2. **Processing**
   - Run `deduplicate_and_merge.py` to process the data
   - The script performs:
     - Deduplication based on name, address, and geo-coordinates
     - Merging of duplicate records with field-level merge logic
     - Generation of unique slug IDs
     - Validation of required fields
     - Conversion to CSV format

3. **Archiving**
   - Before processing, existing files are archived:
     - Production CSV → `archived-production/` with timestamp
     - Input JSONs → `archived-processed/` with timestamp
   - Archives maintain a complete history of all changes

4. **Output**
   - Final processed data is saved as CSV in `production/`
   - The CSV includes all fields from source JSONs
   - Complex data types (arrays, objects) are JSON-stringified

5. **Integration with App**
   - Production data is automatically synced to `app-next-directory/src/data/listings`
   - Use `scripts/sync-listings-data.ps1` for syncing:
     - Production mode: One-time sync
     - Development mode: Continuous sync with file watching

## Usage

### Processing New Listings

1. Add new listings to `Temp_Listings.json`
2. Run the processing script:
   ```powershell
   python listings/deduplicate_and_merge.py
   ```
3. Sync to app-next-directory:
   ```powershell
   ./scripts/sync-listings-data.ps1 -Mode production
   ```

### Development Mode

For development, enable continuous syncing:
```powershell
./scripts/sync-listings-data.ps1 -Mode development
```

### Data Schema

Each listing must include:
- `name`: Venue name
- `city`: City location
- `category`: Type of venue
- `address_string`: Full address
- `coordinates`: Latitude/longitude object

Optional but recommended:
- `description_short`: Brief description
- `description_long`: Detailed description
- `eco_focus_tags`: Array of sustainability features
- `digital_nomad_features`: Array of remote work amenities

## Error Handling

- Invalid JSON files are reported with detailed error messages
- Archiving failures are logged but don't stop processing
- All operations maintain data integrity through error checks

## Best Practices

1. Always validate new listings before adding
2. Use the provided schema format
3. Run processing in a test environment first
4. Regularly check archived files for backup integrity
5. Monitor CSV output for any field formatting issues

## Troubleshooting

Common issues and solutions:
1. **JSON Parse Errors**
   - Validate JSON syntax
   - Check character encoding (use UTF-8)

2. **Duplicate Detection Issues**
   - Review fuzzy matching threshold
   - Check coordinate accuracy

3. **Missing Fields**
   - Ensure required fields are present
   - Verify field names match schema

## Support

For issues or questions:
1. Check error messages in script output
2. Review archived files for data history
3. Contact development team with error logs

# Image Processing Workflow

## Image Processing Features

The system processes images for optimal web delivery with the following features:

1. **Multiple Sizes**:
   - thumbnail (150x150) - For previews and thumbnails
   - small (400x400) - For mobile and list views
   - medium (800x800) - For main content areas
   - large (1200x1200) - For full-screen and high-DPI displays

2. **Multiple Formats**:
   - JPEG (quality: 85%) - For broad compatibility
   - WebP (quality: 85%) - For modern browsers and better compression

3. **Optimization Features**:
   - Automatic format conversion
   - Quality optimization
   - Progressive loading support
   - Proper RGB color space conversion
   - Metadata stripping
   - File size optimization

## Directory Structure

```
app-next-directory/
└── public/
    └── images/
        └── listings/
            └── [listing-id]/
                ├── thumbnail_[hash].jpg
                ├── thumbnail_[hash].webp
                ├── small_[hash].jpg
                ├── small_[hash].webp
                ├── medium_[hash].jpg
                ├── medium_[hash].webp
                ├── large_[hash].jpg
                └── large_[hash].webp
```

## Processing Flow

1. **Image Download**:
   - Images are downloaded from source URLs
   - Temporary storage in `temp_images/`
   - Unique hash generated for each image

2. **Image Processing**:
   - Conversion to RGB color space
   - Resizing for each dimension
   - Format conversion (JPEG + WebP)
   - Quality optimization
   - Storage in listing-specific directories

3. **Data Update**:
   - Original URLs preserved in records
   - New processed image paths added to records
   - All paths use relative URLs for portability

## Usage

After running the deduplication script, process images with:
```powershell
python scripts/process-listing-images.py
```

This will:
1. Read the processed CSV
2. Download and process all images
3. Update the CSV with new image paths
4. Clean up temporary files

## Image Fields in Records

The processed records will contain:

```json
{
  "primary_image": {
    "thumbnail": {
      "jpg": "/images/listings/[id]/thumbnail_[hash].jpg",
      "webp": "/images/listings/[id]/thumbnail_[hash].webp"
    },
    "small": { ... },
    "medium": { ... },
    "large": { ... }
  },
  "gallery_images": [
    {
      "thumbnail": { ... },
      "small": { ... },
      "medium": { ... },
      "large": { ... }
    },
    // ... more gallery images
  ]
}
```

## Error Handling

- Failed downloads are logged but don't stop processing
- Invalid images are skipped with error logging
- Original URLs preserved for retry attempts
- Temporary files automatically cleaned up

## Best Practices

1. **Image Upload**:
   - Prefer high-resolution source images (2000px+)
   - Use RGB color space
   - Provide descriptive filenames
   - Include proper image metadata

2. **Processing**:
   - Monitor disk space during processing
   - Check logs for failed downloads
   - Verify image quality after processing
   - Regular cleanup of temporary files

## Troubleshooting

Common issues and solutions:

1. **Download Failures**:
   - Check URL accessibility
   - Verify network connectivity
   - Check for rate limiting

2. **Processing Errors**:
   - Verify image format support
   - Check disk space
   - Monitor memory usage

3. **Quality Issues**:
   - Review source image quality
   - Check resize algorithm settings
   - Verify color space conversion
