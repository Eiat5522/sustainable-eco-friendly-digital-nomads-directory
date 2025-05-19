# -*- coding: utf-8 -*-
import json
import csv
import os
import re
from thefuzz import fuzz
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime

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
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text

def get_city_code(city):
    return CITY_CODES.get(city.lower(), slugify(city)[:3])

def get_category_code(category):
    return CATEGORY_CODES.get(category.lower(), slugify(category)[:2])

def generate_slug_id(name, city, category):
    return f"{slugify(name)}-{slugify(city)}-{get_city_code(city)}-{get_category_code(category)}"

def fuzzy_match(addr1, addr2, threshold=85):
    return fuzz.token_set_ratio(addr1, addr2) >= threshold

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi/2)**2 + cos(phi1)*cos(phi2)*sin(dlambda/2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

def is_close_geo(coord1, coord2, threshold=50):
    lat1, lon1 = coord1.get('latitude'), coord1.get('longitude')
    lat2, lon2 = coord2.get('latitude'), coord2.get('longitude')
    if None in (lat1, lon1, lat2, lon2):
        return False
    return haversine(lat1, lon1, lat2, lon2) <= threshold

def merge_records(rec_a, rec_b):
    def merge_value(val_a, val_b):
        if isinstance(val_a, list) and isinstance(val_b, list):
            return list(set(val_a + val_b))
        elif isinstance(val_a, dict) and isinstance(val_b, dict):
            return merge_records(val_a, val_b)
        return val_a or val_b

    merged = {}
    for key in set(rec_a.keys()).union(set(rec_b.keys())):
        val_a, val_b = rec_a.get(key), rec_b.get(key)
        merged[key] = merge_value(val_a, val_b)
    return merged

def dedupe_key(record):
    return (
        slugify(record.get('name', '')),
        slugify(record.get('city', '')),
        slugify(record.get('address_string', ''))
    )

def ensure_directories(base_dir):
    """Create all required directories if they don't exist"""
    dirs = {
        'output': os.path.join(base_dir, 'production'),
        'archived_production': os.path.join(base_dir, 'archived-production'),
        'archived_processed': os.path.join(base_dir, 'archived-processed')
    }

    for path in dirs.values():
        os.makedirs(path, exist_ok=True)

    return dirs

def archive_files(files_to_archive, archive_date, dirs):
    """Archive the existing files with timestamps"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    processed_folder = os.path.join(
        dirs['archived_processed'],
        f'{archive_date}-{timestamp}-Archived-Processed-Listings'
    )
    os.makedirs(processed_folder, exist_ok=True)

    for src_path, dest_name in files_to_archive.items():
        if os.path.exists(src_path):
            base, ext = os.path.splitext(dest_name)
            timestamped_name = f"{base}_{timestamp}{ext}"
            dest_path = os.path.join(processed_folder, timestamped_name)

            try:
                # For production CSV, archive to archived-production
                if src_path.endswith('Listing_Population_Template.csv'):
                    production_dest = os.path.join(
                        dirs['archived_production'],
                        f'Listing_Population_Template_{archive_date}_{timestamp}.csv'
                    )
                    os.replace(src_path, production_dest)
                else:
                    # For input JSON files, archive to archived-processed
                    os.replace(src_path, dest_path)
            except Exception as e:
                print(f"Warning: Could not archive {src_path}: {str(e)}")
                continue

def main():
    try:
        # File Paths
        base_dir = r'd:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/listings'
        temp_listings = os.path.join(base_dir, 'Temp_Listings.json')
        listings = os.path.join(base_dir, 'Listings.json')

        # Setup directories
        dirs = ensure_directories(base_dir)
        output_csv = os.path.join(dirs['output'], 'Listing_Population_Template.csv')

        # Load Data before archiving
        temp_data = []
        listings_data = []

        try:
            if os.path.exists(temp_listings):
                with open(temp_listings, encoding='utf-8') as f:
                    temp_data = json.load(f)
            if os.path.exists(listings):
                with open(listings, encoding='utf-8') as f:
                    listings_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Warning: Error reading JSON files: {str(e)}")
            return

        # Archive existing files
        archive_date = datetime.now().strftime('%Y-%m-%d')
        files_to_archive = {
            output_csv: 'Listing_Population_Template.csv',
            temp_listings: 'Temp_Listings.json',
            listings: 'Listings.json'
        }
        archive_files(files_to_archive, archive_date, dirs)

        # Process Records
        seen_keys = set()
        final_records = []

        for rec in temp_data:
            key = dedupe_key(rec)
            seen_keys.add(key)
            if 'id' not in rec:
                rec['id'] = generate_slug_id(
                    rec.get('name', ''),
                    rec.get('city', ''),
                    rec.get('category', '')
                )
            final_records.append(rec)

        for rec in listings_data:
            key = dedupe_key(rec)
            is_duplicate = any(
                fuzzy_match(rec['address_string'], other['address_string'])
                for other in final_records
                if other['name'].lower() == rec['name'].lower()
                and other['city'].lower() == rec['city'].lower()
            )

            is_geo_duplicate = any(
                is_close_geo(rec.get('coordinates', {}), other.get('coordinates', {}))
                for other in final_records
            )

            if is_duplicate or is_geo_duplicate:
                for idx, other in enumerate(final_records):
                    if (dedupe_key(other) == key or
                        fuzzy_match(rec['address_string'], other['address_string'])):
                        final_records[idx] = merge_records(other, rec)
                        break
            else:
                if 'id' not in rec:
                    rec['id'] = generate_slug_id(
                        rec.get('name', ''),
                        rec.get('city', ''),
                        rec.get('category', '')
                    )
                final_records.append(rec)

        # Write Output
        fieldnames = set().union(*(r.keys() for r in final_records))
        with open(output_csv, 'w', encoding='utf-8', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            for record in final_records:
                row = {}
                for key, value in record.items():
                    if isinstance(value, (list, dict)):
                        row[key] = json.dumps(value, ensure_ascii=False)
                    else:
                        row[key] = value
                writer.writerow(row)

        # Print Summary
        print(f"Total Records: {len(final_records)}")
        print(f"CSV saved to: {output_csv}")
        print("\nArchive Process Summary:")
        print(f"Archived Production: {os.listdir(dirs['archived_production'])}")
        print(f"Archived Processed: {os.listdir(dirs['archived_processed'])}")

        return final_records

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise

if __name__ == "__main__":
    main()
