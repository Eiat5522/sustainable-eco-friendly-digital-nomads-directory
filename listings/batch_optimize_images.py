"""
Batch Image Optimization Script for Sanity Integration (Workstream 3.2)

- Optimizes all images in sanity_image_staging/images/
- Resizes, compresses, and converts images to WebP (or keeps original if preferred)
- Outputs optimized images to sanity_image_staging/optimized/
- Designed for batch processing and future integration with Sanity upload

Requirements:
- Python 3.x
- Pillow (pip install Pillow)

TODO: Integrate with Sanity upload script after optimization is verified.
"""

import os
from PIL import Image

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))  # Go up one level from listings/
SOURCE_DIR = os.path.join(PROJECT_ROOT, 'sanity_image_staging', 'images')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'sanity_image_staging', 'optimized')
TARGET_SIZE = (1600, 1200)  # Example max dimensions (width, height)
QUALITY = 85  # JPEG/WebP quality

os.makedirs(OUTPUT_DIR, exist_ok=True)

SUPPORTED_FORMATS = ('.jpg', '.jpeg', '.png', '.webp')

def optimize_image(src_path, dest_path):
    try:
        with Image.open(src_path) as img:
            img = img.convert('RGB')
            img.thumbnail(TARGET_SIZE, Image.LANCZOS)
            dest_path = os.path.splitext(dest_path)[0] + '.webp'
            img.save(dest_path, 'WEBP', quality=QUALITY, method=6)
            print(f"Optimized: {src_path} -> {dest_path}")
    except Exception as e:
        print(f"Error optimizing {src_path}: {e}")

def batch_optimize():
    for fname in os.listdir(SOURCE_DIR):
        if fname.lower().endswith(SUPPORTED_FORMATS):
            src_path = os.path.join(SOURCE_DIR, fname)
            dest_path = os.path.join(OUTPUT_DIR, fname)
            optimize_image(src_path, dest_path)

if __name__ == "__main__":
    batch_optimize()
    print("Batch image optimization complete.")
