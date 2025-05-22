import json
import os
import re
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
from thefuzz import fuzz
from pathlib import Path
import shutil

# Configuration
LISTINGS_DIR = Path("d:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/listings")
APP_PUBLIC_DIR = Path("d:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/app-scaffold/public")
IMAGE_STAGING_DIR = Path("d:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/sanity_image_staging")

LISTINGS_FILES = [
    LISTINGS_DIR / "listings.json",
    LISTINGS_DIR / "temp_listings.json"
]

# === City code mapping (3 lowercase letters, IATA or mnemonic) ===
CITY_CODES = {
    'bangkok': 'bkk',
    'chiang mai': 'cnx',
    'phuket': 'hkt',
    'koh lanta': 'lnt',
    'koh samui': 'usm',
    'pattaya': 'pty',
    'hua hin': 'hhn',
    'krabi': 'kbv',
    'ayutthaya': 'ayt',
    'udon thani': 'uth',
}

CATEGORY_CODES = {
    'coworking': 'cw',
    'cafe': 'cf',
    'accommodation': 'ac',
    'restaurant': 'rs',
    'activity': 'at',
    'coliving': 'cl',
    'retreat': 'rt',
}

def slugify(text):
    if not isinstance(text, str):
        return ""
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text

def get_city_code(city):
    return CITY_CODES.get(str(city).lower(), slugify(str(city))[:3])

def get_category_code(category):
    return CATEGORY_CODES.get(str(category).lower(), slugify(str(category))[:2])

def fuzzy_match(addr1, addr2, threshold=85):
    if not all(isinstance(s, str) for s in [addr1, addr2]):
        return False
    return fuzz.token_set_ratio(addr1, addr2) >= threshold

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    try:
        phi1, phi2 = radians(float(lat1)), radians(float(lat2))
        dphi = radians(float(lat2) - float(lat1))
        dlambda = radians(float(lon2) - float(lon1))
        a = sin(dphi / 2)**2 + cos(phi1) * cos(phi2) * sin(dlambda / 2)**2
        return 2 * R * atan2(sqrt(a), sqrt(1 - a))
    except (ValueError, TypeError):
        return float('inf') # Cannot calculate distance

def is_close_geo(coord1, coord2, threshold=100): # Increased threshold slightly
    if not (coord1 and coord2 and isinstance(coord1, dict) and isinstance(coord2, dict)):
        return False
    lat1, lon1 = coord1.get('latitude'), coord1.get('longitude')
    lat2, lon2 = coord2.get('latitude'), coord2.get('longitude')

    if None in (lat1, lon1, lat2, lon2):
        return False # Not enough data for comparison

    # Ensure coordinates are not empty strings before attempting conversion
    if any(isinstance(c, str) and not c.strip() for c in [lat1, lon1, lat2, lon2]):
        return False

    return haversine(lat1, lon1, lat2, lon2) <= threshold

def merge_records(rec_a, rec_b, preference='temp'):
    """
    Merges two records.
    'preference' determines which record's value is taken in case of conflict.
    'temp' means temp_listings.json (rec_b) is preferred.
    'listings' means listings.json (rec_a) is preferred.
    """
    merged = {}

    # Prefer rec_b (temp_listings.json) if preference is 'temp'
    preferred_rec = rec_b if preference == 'temp' else rec_a
    secondary_rec = rec_a if preference == 'temp' else rec_b

    all_keys = set(preferred_rec.keys()).union(set(secondary_rec.keys()))

    for key in all_keys:
        val_preferred = preferred_rec.get(key)
        val_secondary = secondary_rec.get(key)

        if val_preferred is not None and val_preferred != "":
            if isinstance(val_preferred, list) and not val_preferred: # Empty list from preferred
                 merged[key] = val_secondary if val_secondary is not None else []
            else:
                merged[key] = val_preferred
        elif val_secondary is not None and val_secondary != "":
            merged[key] = val_secondary
        else: # Both are None or empty string, prefer None or empty from preferred
             merged[key] = val_preferred if val_preferred is not None else val_secondary


    # Specific merging logic for arrays like gallery_image_urls or eco_focus_tags:
    # Example: Union of both lists, removing duplicates
    for list_key in ['gallery_image_urls', 'eco_focus_tags', 'digital_nomad_features', 'source_urls']:
        list_a = preferred_rec.get(list_key, [])
        list_b = secondary_rec.get(list_key, [])

        # Ensure they are lists
        if not isinstance(list_a, list): list_a = [list_a] if list_a else []
        if not isinstance(list_b, list): list_b = [list_b] if list_b else []

        # Filter out None or empty strings before creating set
        set_a = {item for item in list_a if item and isinstance(item, str) and item.strip()}
        set_b = {item for item in list_b if item and isinstance(item, str) and item.strip()}

        merged_list = sorted(list(set_a.union(set_b)))
        if merged_list: # Only add if there's something to merge
            merged[list_key] = merged_list
        elif key not in merged : # If the key wasn't set by preferred/secondary non-list value
             merged[list_key] = []


    # Ensure 'id' field is present, prefer 'id' from temp_listings if available and valid
    if preferred_rec.get("id") and isinstance(preferred_rec.get("id"), str) and preferred_rec.get("id").strip():
        merged["id"] = preferred_rec.get("id")
    elif secondary_rec.get("id") and isinstance(secondary_rec.get("id"), str) and secondary_rec.get("id").strip():
        merged["id"] = secondary_rec.get("id")
    else: # Fallback if no good ID
        merged["id"] = f"generated-id-{slugify(merged.get('name', 'unknown'))}"


    # Prioritize coordinates from temp_listings if they seem more complete
    coords_preferred = preferred_rec.get('coordinates')
    coords_secondary = secondary_rec.get('coordinates')

    if isinstance(coords_preferred, dict) and \
       coords_preferred.get('latitude') is not None and coords_preferred.get('longitude') is not None:
        merged['coordinates'] = coords_preferred
    elif isinstance(coords_secondary, dict) and \
         coords_secondary.get('latitude') is not None and coords_secondary.get('longitude') is not None:
        merged['coordinates'] = coords_secondary
    elif isinstance(coords_preferred, dict): # If preferred has at least some coord data
        merged['coordinates'] = coords_preferred
    else:
        merged['coordinates'] = coords_secondary # Fallback to secondary or None

    return merged


def collect_image_paths():
    """Collects all unique image paths from the listings JSON files."""
    image_paths = set()
    for file_path in LISTINGS_FILES:
        if not file_path.exists():
            print(f"Warning: Listings file not found: {file_path}")
            continue
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                for listing in data:
                    if not isinstance(listing, dict): # Handle potential empty items or non-dict items
                        continue
                    primary_image = listing.get("primary_image_url")
                    if primary_image and isinstance(primary_image, str) and primary_image.strip():
                        image_paths.add(primary_image.strip())

                    gallery_images = listing.get("gallery_image_urls")
                    if gallery_images and isinstance(gallery_images, list):
                        for img_url in gallery_images:
                            if img_url and isinstance(img_url, str) and img_url.strip():
                                image_paths.add(img_url.strip())
            except json.JSONDecodeError:
                print(f"Error decoding JSON from {file_path}")
            except Exception as e:
                print(f"An unexpected error occurred while processing {file_path}: {e}")
    return image_paths

def stage_images(image_paths):
    """Copies images from their source location to the staging directory."""
    if not IMAGE_STAGING_DIR.exists():
        IMAGE_STAGING_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created staging directory: {IMAGE_STAGING_DIR}")

    copied_count = 0
    missing_count = 0

    for rel_path in image_paths:
        if not rel_path.startswith("/"):
            print(f"Skipping potentially invalid relative path: {rel_path}")
            continue

        # Source path is relative to APP_PUBLIC_DIR (e.g., /images/listings/foo.jpg -> app-scaffold/public/images/listings/foo.jpg)
        # We strip the leading '/' to correctly join with APP_PUBLIC_DIR
        source_image_path = APP_PUBLIC_DIR / rel_path.lstrip("/")

        # Destination path maintains the relative structure within IMAGE_STAGING_DIR
        destination_image_path = IMAGE_STAGING_DIR / rel_path.lstrip("/")

        if source_image_path.exists() and source_image_path.is_file():
            try:
                destination_image_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_image_path, destination_image_path)
                # print(f"Copied: {source_image_path} to {destination_image_path}")
                copied_count += 1
            except Exception as e:
                print(f"Error copying {source_image_path} to {destination_image_path}: {e}")
                missing_count += 1
        else:
            print(f"Warning: Source image not found: {source_image_path}")
            missing_count += 1

    print(f"\nImage staging summary:")
    print(f"  Successfully copied: {copied_count} images")
    print(f"  Missing source images: {missing_count} images")

def process_records_for_merge(temp_data, listings_data):
    """
    Processes and merges records from temp_data and listings_data.
    temp_data (from temp_listings.json) is given preference for conflicting fields.
    """
    if not isinstance(temp_data, list): temp_data = []
    if not isinstance(listings_data, list): listings_data = []

    # Create a dictionary for listings_data for easier lookup by 'id'
    listings_map = {item.get('id'): item for item in listings_data if isinstance(item, dict) and item.get('id')}

    merged_records = []
    processed_listing_ids = set()

    # First, process items from temp_data, merging with listings_data if a match is found
    for temp_item in temp_data:
        if not isinstance(temp_item, dict): continue
        temp_id = temp_item.get('id')
        if not temp_id or not isinstance(temp_id, str) or not temp_id.strip():
            # If temp_item has no usable ID, try to generate one or skip
            print(f"Skipping temp_item with missing/invalid ID: {str(temp_item.get('name', 'N/A'))[:50]}")
            continue

        if temp_id in listings_map:
            listing_item = listings_map[temp_id]
            merged_item = merge_records(listing_item, temp_item, preference='temp')
            merged_records.append(merged_item)
            processed_listing_ids.add(temp_id)
        else:
            # If not in listings_data, add temp_item as is (it's preferred)
            merged_records.append(temp_item)
        processed_listing_ids.add(temp_id) # Add here too to cover items only in temp

    # Add items from listings_data that were not in temp_data
    for listing_item in listings_data:
        if not isinstance(listing_item, dict): continue
        listing_id = listing_item.get('id')
        if not listing_id or not isinstance(listing_id, str) or not listing_id.strip():
            print(f"Skipping listing_item with missing/invalid ID: {str(listing_item.get('name', 'N/A'))[:50]}")
            continue

        if listing_id not in processed_listing_ids:
            merged_records.append(listing_item)
            processed_listing_ids.add(listing_id)

    # --- Advanced Deduplication Pass ---
    # This pass tries to find duplicates that don't share an ID but are very similar
    final_deduped_records = []
    potential_duplicates = {} # Store by a composite key (name, city, approx_address)

    for record in merged_records:
        if not isinstance(record, dict): continue
        name = slugify(record.get('name', ''))
        city = slugify(record.get('city', ''))

        # For address, take first N characters for grouping, as full fuzzy match is expensive here
        address_prefix = slugify(record.get('address_string', ''))[:30]

        # Skip if essential components for key are missing
        if not name or not city:
            final_deduped_records.append(record) # Cannot dedupe, so add as is
            continue

        key = (name, city, address_prefix)

        is_duplicate = False
        if key in potential_duplicates:
            existing_record = potential_duplicates[key]
            # Stronger check: fuzzy address AND geo-proximity if coords exist
            if fuzzy_match(record.get('address_string'), existing_record.get('address_string')) and \
               is_close_geo(record.get('coordinates'), existing_record.get('coordinates')):
                print(f"Advanced Dedupe: Found duplicate for '{record.get('name')}' in '{record.get('city')}'. Merging.")
                # Merge current record into the existing one (preferring current if it's from temp_listings origin)
                # This requires knowing the origin, which is complex here. Simpler: prefer the one already in potential_duplicates
                # or the one with more fields filled. For now, let's assume merge_records handles preference.
                # We need to decide which one is 'rec_a' and 'rec_b' for merge_records.
                # Let's assume 'existing_record' is rec_a and 'record' is rec_b.
                # Preference should ideally be based on which original file it came from,
                # or which record has more complete data.
                # For simplicity, let's use the 'temp' preference (new record is preferred).
                potential_duplicates[key] = merge_records(existing_record, record, preference='temp')
                is_duplicate = True

        if not is_duplicate:
            potential_duplicates[key] = record

    final_deduped_records = list(potential_duplicates.values())
    print(f"Initial merged count: {len(merged_records)}, After advanced dedupe: {len(final_deduped_records)}")
    return final_deduped_records


def main():
    print("Starting image preparation for Sanity migration...")
    all_image_paths = collect_image_paths()
    if not all_image_paths:
        print("No image paths found to process.")
        return

    print(f"Found {len(all_image_paths)} unique image paths to process.")
    stage_images(all_image_paths)
    print(f"Image preparation complete. Staged images are in: {IMAGE_STAGING_DIR}")

    base_dir = Path("d:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/listings")

    temp_listings_file = base_dir / "temp_listings.json"
    listings_file = base_dir / "listings.json"
    output_file = base_dir / "merged_listings.json"

    print(f"Loading data from {temp_listings_file}...")
    try:
        with open(temp_listings_file, 'r', encoding='utf-8') as f:
            temp_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {temp_listings_file} not found.")
        temp_data = []
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {temp_listings_file}.")
        temp_data = []

    print(f"Loading data from {listings_file}...")
    try:
        with open(listings_file, 'r', encoding='utf-8') as f:
            listings_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {listings_file} not found.")
        listings_data = []
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {listings_file}.")
        listings_data = []

    if not isinstance(temp_data, list):
        print(f"Warning: Data from {temp_listings_file} is not a list. Treating as empty.")
        temp_data = []
    if not isinstance(listings_data, list):
        print(f"Warning: Data from {listings_file} is not a list. Treating as empty.")
        listings_data = []

    # Filter out any non-dictionary items from the lists
    temp_data = [item for item in temp_data if isinstance(item, dict)]
    listings_data = [item for item in listings_data if isinstance(item, dict)]

    print(f"Processing {len(temp_data)} records from temp_listings and {len(listings_data)} records from listings.")

    merged_records = process_records_for_merge(temp_data, listings_data)

    print(f"Total merged and deduplicated records: {len(merged_records)}")

    print(f"Writing merged data to {output_file}...")
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(merged_records, f, indent=2)
        print("Successfully wrote merged data.")
    except Exception as e:
        print(f"Error writing merged data: {e}")

    print("Deduplication and merge process complete.")

if __name__ == "__main__":
    main()
