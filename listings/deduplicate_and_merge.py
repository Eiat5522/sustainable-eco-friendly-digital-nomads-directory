import json
import os
import re
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
from thefuzz import fuzz
from pathlib import Path

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
    merged = {}

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

    for list_key in ['gallery_image_urls', 'eco_focus_tags', 'digital_nomad_features', 'source_urls']:
        list_a = preferred_rec.get(list_key, [])
        list_b = secondary_rec.get(list_key, [])

        if not isinstance(list_a, list): list_a = [list_a] if list_a else []
        if not isinstance(list_b, list): list_b = [list_b] if list_b else []

        set_a = {item for item in list_a if item and isinstance(item, str) and item.strip()}
        set_b = {item for item in list_b if item and isinstance(item, str) and item.strip()}

        merged_list = sorted(list(set_a.union(set_b)))
        if merged_list:
            merged[list_key] = merged_list
        elif key not in merged :
             merged[list_key] = []

    if preferred_rec.get("id") and isinstance(preferred_rec.get("id"), str) and preferred_rec.get("id").strip():
        merged["id"] = preferred_rec.get("id")
    elif secondary_rec.get("id") and isinstance(secondary_rec.get("id"), str) and secondary_rec.get("id").strip():
        merged["id"] = secondary_rec.get("id")
    else:
        merged["id"] = f"generated-id-{slugify(merged.get('name', 'unknown'))}"

    coords_preferred = preferred_rec.get('coordinates')
    coords_secondary = secondary_rec.get('coordinates')

    if isinstance(coords_preferred, dict) and \
       coords_preferred.get('latitude') is not None and coords_preferred.get('longitude') is not None:
        merged['coordinates'] = coords_preferred
    elif isinstance(coords_secondary, dict) and \
         coords_secondary.get('latitude') is not None and coords_secondary.get('longitude') is not None:
        merged['coordinates'] = coords_secondary
    elif isinstance(coords_preferred, dict):
        merged['coordinates'] = coords_preferred
    else:
        merged['coordinates'] = coords_secondary

    return merged

def process_records_for_merge(temp_data, listings_data):
    if not isinstance(temp_data, list): temp_data = []
    if not isinstance(listings_data, list): listings_data = []

    listings_map = {item.get('id'): item for item in listings_data if isinstance(item, dict) and item.get('id')}

    merged_records = []
    processed_listing_ids = set()

    for temp_item in temp_data:
        if not isinstance(temp_item, dict): continue
        temp_id = temp_item.get('id')
        if not temp_id or not isinstance(temp_id, str) or not temp_id.strip():
            print(f"Skipping temp_item with missing/invalid ID: {str(temp_item.get('name', 'N/A'))[:50]}")
            continue

        if temp_id in listings_map:
            listing_item = listings_map[temp_id]
            merged_item = merge_records(listing_item, temp_item, preference='temp')
            merged_records.append(merged_item)
            processed_listing_ids.add(temp_id)
        else:
            merged_records.append(temp_item)
        processed_listing_ids.add(temp_id)

    for listing_item in listings_data:
        if not isinstance(listing_item, dict): continue
        listing_id = listing_item.get('id')
        if not listing_id or not isinstance(listing_id, str) or not listing_id.strip():
            print(f"Skipping listing_item with missing/invalid ID: {str(listing_item.get('name', 'N/A'))[:50]}")
            continue

        if listing_id not in processed_listing_ids:
            merged_records.append(listing_item)
            processed_listing_ids.add(listing_id)

    final_deduped_records = []
    potential_duplicates = {}

    for record in merged_records:
        if not isinstance(record, dict): continue
        name = slugify(record.get('name', ''))
        city = slugify(record.get('city', ''))

        address_prefix = slugify(record.get('address_string', ''))[:30]

        if not name or not city:
            final_deduped_records.append(record)
            continue

        key = (name, city, address_prefix)

        is_duplicate = False
        if key in potential_duplicates:
            existing_record = potential_duplicates[key]
            if fuzzy_match(record.get('address_string'), existing_record.get('address_string')) and \
               is_close_geo(record.get('coordinates'), existing_record.get('coordinates')):
                print(f"Advanced Dedupe: Found duplicate for '{record.get('name')}' in '{record.get('city')}'. Merging.")
                potential_duplicates[key] = merge_records(existing_record, record, preference='temp')
                is_duplicate = True

        if not is_duplicate:
            potential_duplicates[key] = record

    final_deduped_records = list(potential_duplicates.values())
    print(f"Initial merged count: {len(merged_records)}, After advanced dedupe: {len(final_deduped_records)}")
    return final_deduped_records

def main():
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
