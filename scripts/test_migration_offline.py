"""
Offline Migration Test Script (Workstream 3.1/3.2)

Tests the migration logic without requiring Sanity API connection.
Validates data transformation, image path resolution, and document structure.
"""

import json
import sys
from pathlib import Path

# Import functions from the main migration script
sys.path.append(str(Path(__file__).parent))
from migrate_listings_to_sanity import find_image_path, slugify_for_sanity_id, get_content_type

# --- Configuration ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MERGED_LISTINGS_PATH = PROJECT_ROOT / "listings" / "merged_listings.json"

def test_data_transformation():
    """Test the data transformation logic without API calls"""
    print("=== Offline Migration Test ===\n")

    if not MERGED_LISTINGS_PATH.exists():
        print(f"Error: Merged listings file not found at {MERGED_LISTINGS_PATH}")
        return False

    try:
        with open(MERGED_LISTINGS_PATH, 'r', encoding='utf-8') as f:
            listings_data = json.load(f)
        print(f"Loaded {len(listings_data)} listings from {MERGED_LISTINGS_PATH}")
    except Exception as e:
        print(f"Error reading listings: {e}")
        return False

    # Test with first 3 listings
    test_listings = listings_data[:3]
    print(f"Testing data transformation with {len(test_listings)} listings\n")

    success_count = 0
    error_count = 0

    for index, listing in enumerate(test_listings):
        print(f"Processing listing {index + 1}: {listing.get('name', 'N/A')}")

        try:
            # Test ID generation
            doc_id_base = listing.get('slug') or listing.get('id') or listing.get('name')
            doc_id = slugify_for_sanity_id(doc_id_base)

            if not doc_id:
                print(f"  ❌ Invalid ID generation for: {listing.get('name', 'N/A')}")
                error_count += 1
                continue

            print(f"  📋 Document ID: {doc_id}")

            # Test image path resolution
            main_image = listing.get("primary_image_url")
            if main_image:
                image_path = find_image_path(main_image)
                if image_path:
                    content_type = get_content_type(image_path)
                    print(f"  🖼️  Main image found: {image_path.name} ({content_type})")
                else:
                    print(f"  ⚠️  Main image not found: {main_image}")

            # Test gallery images
            gallery_images = listing.get("gallery_image_urls", [])
            found_gallery = 0
            for gallery_img in gallery_images:
                if gallery_img and find_image_path(gallery_img):
                    found_gallery += 1

            if gallery_images:
                print(f"  🖼️  Gallery images: {found_gallery}/{len(gallery_images)} found")

            # Test coordinate parsing
            coords = listing.get("coordinates")
            if coords and isinstance(coords, dict):
                try:
                    lat = float(coords.get("latitude", 0))
                    lng = float(coords.get("longitude", 0))
                    print(f"  📍 Location: {lat}, {lng}")
                except (ValueError, TypeError):
                    print(f"  ⚠️  Invalid coordinates: {coords}")

            # Test sustainability rating
            s_rating = listing.get("sustainability_rating")
            if s_rating is not None:
                try:
                    rating = float(s_rating)
                    print(f"  🌱 Sustainability rating: {rating}")
                except (ValueError, TypeError):
                    print(f"  ⚠️  Invalid sustainability rating: {s_rating}")

            print(f"  ✅ Document structure valid\n")
            success_count += 1

        except Exception as e:
            print(f"  ❌ Error processing listing: {e}\n")
            error_count += 1

    print("=== Test Summary ===")
    print(f"Successfully processed: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Success rate: {(success_count / len(test_listings)) * 100:.1f}%")

    return error_count == 0

if __name__ == "__main__":
    success = test_data_transformation()
    exit(0 if success else 1)
