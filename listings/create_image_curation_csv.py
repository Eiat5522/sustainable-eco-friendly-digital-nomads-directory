import json
import csv
from pathlib import Path

def generate_curation_csv():
    # Script is in 'listings', so base_dir is its own directory
    base_dir = Path(__file__).resolve().parent
    merged_json_path = base_dir / "merged_listings.json"
    output_csv_path = base_dir / "image_curation_helper.csv"

    relevant_fields = [
        "id",
        "name",
        "primary_image_url",
        "gallery_image_urls",
        "source_urls"
    ]

    try:
        with open(merged_json_path, 'r', encoding='utf-8') as f:
            listings_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {merged_json_path} not found.")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from {merged_json_path}. Details: {e}")
        return

    if not isinstance(listings_data, list):
        print(f"Error: Data in {merged_json_path} is not a list.")
        return

    processed_listings = []
    for listing in listings_data:
        if not isinstance(listing, dict):
            print(f"Skipping non-dictionary item: {listing}")
            continue

        row = {}
        for field in relevant_fields:
            value = listing.get(field)
            if isinstance(value, list):
                # Join list items with a semicolon, filter out None or empty strings
                row[field] = "; ".join(filter(None, [str(v).strip() for v in value if str(v).strip()]))
            elif value is not None:
                row[field] = str(value).strip()
            else:
                row[field] = ""
        processed_listings.append(row)

    if not processed_listings:
        print("No valid listing data to write to CSV.")
        return

    try:
        with open(output_csv_path, 'w', encoding='utf-8', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=relevant_fields)
            writer.writeheader()
            writer.writerows(processed_listings)
        print(f"Successfully created image curation CSV: {output_csv_path}")
    except IOError as e:
        print(f"Error: Could not write to CSV file {output_csv_path}. Details: {e}")
    except Exception as e:
        print(f"An unexpected error occurred while writing CSV: {e}")

if __name__ == "__main__":
    generate_curation_csv()
