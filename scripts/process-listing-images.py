#!/usr/bin/env python3
import os
import json
import shutil
from PIL import Image
import requests
from datetime import datetime
import hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

# Image size configurations
IMAGE_SIZES = {
    'thumbnail': (150, 150),
    'small': (400, 400),
    'medium': (800, 800),
    'large': (1200, 1200)
}

# Quality settings
JPEG_QUALITY = 85
WEBP_QUALITY = 85

class ImageProcessor:
    def __init__(self, base_dir):
        self.base_dir = Path(base_dir)
        self.public_dir = self.base_dir / 'app-next-directory' / 'public'
        self.images_dir = self.public_dir / 'images' / 'listings'
        self.temp_dir = self.base_dir / 'temp_images'
        self.setup_directories()

    def setup_directories(self):
        """Create necessary directories if they don't exist"""
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def generate_image_hash(self, url):
        """Generate a unique hash for the image URL"""
        return hashlib.md5(url.encode()).hexdigest()

    def download_image(self, url, listing_id):
        """Download image from URL to temporary directory"""
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()

            # Generate unique filename
            image_hash = self.generate_image_hash(url)
            ext = os.path.splitext(urlparse(url).path)[1] or '.jpg'
            temp_path = self.temp_dir / f"{listing_id}_{image_hash}{ext}"

            with open(temp_path, 'wb') as f:
                shutil.copyfileobj(response.raw, f)

            return temp_path
        except Exception as e:
            print(f"Error downloading {url}: {str(e)}")
            return None

    def process_image(self, image_path, listing_id, is_primary=False):
        """Process a single image into multiple sizes and formats"""
        try:
            image = Image.open(image_path)
            image_hash = image_path.stem.split('_')[1]  # Get hash part from filename

            # Convert RGBA to RGB if necessary
            if image.mode == 'RGBA':
                background = Image.new('RGB', image.size, 'white')
                background.paste(image, mask=image.split()[3])
                image = background

            paths = {}

            # Process each size
            for size_name, dimensions in IMAGE_SIZES.items():
                img_copy = image.copy()
                img_copy.thumbnail(dimensions, Image.Resampling.LANCZOS)

                # Save both JPEG and WebP versions
                for fmt in ['jpg', 'webp']:
                    output_dir = self.images_dir / listing_id
                    output_dir.mkdir(exist_ok=True)

                    filename = f"{size_name}_{image_hash}.{fmt}"
                    output_path = output_dir / filename

                    if fmt == 'jpg':
                        img_copy.save(output_path, 'JPEG', quality=JPEG_QUALITY, optimize=True)
                    else:
                        img_copy.save(output_path, 'WEBP', quality=WEBP_QUALITY)

                    # Store relative path for the database
                    relative_path = f"/images/listings/{listing_id}/{filename}"
                    if size_name not in paths:
                        paths[size_name] = {}
                    paths[size_name][fmt] = relative_path

            return paths
        except Exception as e:
            print(f"Error processing image {image_path}: {str(e)}")
            return None

    def process_listing_images(self, listing):
        """Process all images for a listing"""
        try:
            # Process primary image
            if 'primary_image_url' in listing:
                temp_path = self.download_image(listing['primary_image_url'], listing['id'])
                if temp_path:
                    paths = self.process_image(temp_path, listing['id'], is_primary=True)
                    if paths:
                        listing['primary_image'] = paths
                    temp_path.unlink()  # Clean up temp file

            # Process gallery images
            if 'gallery_image_urls' in listing:
                gallery_images = []
                for url in listing['gallery_image_urls']:
                    temp_path = self.download_image(url, listing['id'])
                    if temp_path:
                        paths = self.process_image(temp_path, listing['id'])
                        if paths:
                            gallery_images.append(paths)
                        temp_path.unlink()  # Clean up temp file
                if gallery_images:
                    listing['gallery_images'] = gallery_images

            return listing
        except Exception as e:
            print(f"Error processing listing {listing.get('id')}: {str(e)}")
            return listing

def main():
    base_dir = Path(r'd:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory')
    processor = ImageProcessor(base_dir)

    # Process listings
    listings_file = base_dir / 'listings' / 'production' / 'Listing_Population_Template.csv'
    if not listings_file.exists():
        print(f"Listings file not found: {listings_file}")
        return

    # Read CSV and convert to list of dicts
    import csv
    with open(listings_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)

    # Process images for each listing
    with ThreadPoolExecutor(max_workers=4) as executor:
        processed_listings = list(executor.map(processor.process_listing_images, listings))

    # Write back to CSV
    with open(listings_file, 'w', encoding='utf-8', newline='') as f:
        if processed_listings:
            writer = csv.DictWriter(f, fieldnames=processed_listings[0].keys())
            writer.writeheader()
            writer.writerows(processed_listings)

    print("Image processing complete!")

if __name__ == "__main__":
    main()
