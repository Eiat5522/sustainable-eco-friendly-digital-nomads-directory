# -*- coding: utf-8 -*-
import json
import csv
import os
import re

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
    # Add more as needed
}

# === Category code mapping (2 lowercase letters, intuitive abbreviations) ===
CATEGORY_CODES = {
    'coworking': 'cw',
    'cafe': 'cf',
    'accommodation': 'ac',
    'restaurant': 'rs',
    'activity': 'at',
    'coliving': 'cl',
    'retreat': 'rt',
    # Add more as needed
}

def slugify(text):
    """Converts string to lowercase, removes special chars, replaces spaces with dashes."""
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text

def get_city_code(city):
    city = city.lower() if city else ''
    return CITY_CODES.get(city, slugify(city)[:3])

def get_category_code(category):
    category = category.lower() if category else ''
    return CATEGORY_CODES.get(category, slugify(category)[:2])

def generate_slug_id(name, city, category):
    """
    Generates an SEO-friendly ID in the format:
    {slugified-name}-{slugified-city}-{citycode}-{categorycode}
    """
    return f"{slugify(name)}-{slugify(city)}-{get_city_code(city)}-{get_category_code(category)}"

# File paths
BASE_DIR = r'd:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory'
TEMP_LISTINGS = os.path.join(BASE_DIR, 'temp_listings.json')
LISTINGS = os.path.join(BASE_DIR, 'src/data/listings.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'deduplication_output')
OUTPUT_CSV = os.path.join(OUTPUT_DIR, 'listing_population_template.csv')

# Load JSON files
def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

temp_data = load_json(TEMP_LISTINGS)
listings_data = load_json(LISTINGS)

# Helper: get key for deduplication
def dedupe_key(record):
    return (record.get('name', '').strip().lower(), record.get('city', '').strip().lower())

# Build set of (name, city) from temp_listings
seen_keys = set(dedupe_key(r) for r in temp_data)

# Deduped records (from temp_listings)
deduped = list(temp_data)
unique_from_listings = []

# Get fieldnames from temp_listings (union of all fields)
fieldnames = set()
for r in temp_data:
    fieldnames.update(r.keys())
fieldnames = list(fieldnames)

# Deduplicate: keep only unique records from listings.json
for rec in listings_data:
    key = dedupe_key(rec)
    if key not in seen_keys:
        # Map fields to temp_listings schema
        new_rec = {k: rec.get(k, None) for k in fieldnames}
        # Generate SEO-friendly ID
        new_rec['id'] = generate_slug_id(rec.get('name', ''), rec.get('city', ''), rec.get('category', ''))
        unique_from_listings.append(new_rec)

# Combine all
final_records = deduped + unique_from_listings

# Write CSV
with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in final_records:
        # Convert lists/dicts to JSON strings for CSV
        for k, v in row.items():
            if isinstance(v, (list, dict)):
                row[k] = json.dumps(v, ensure_ascii=False)
        writer.writerow(row)

print(f"Deduped: {len(deduped)} | Unique: {len(unique_from_listings)} | Total: {len(final_records)}")
print(f"CSV saved to: {OUTPUT_CSV}")
