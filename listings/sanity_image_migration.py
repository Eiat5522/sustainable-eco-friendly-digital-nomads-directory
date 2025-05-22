"""
Sanity Image Migration Script
Handles the migration of images to Sanity CMS with proper error handling and logging.
"""

import asyncio
import logging
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse

import aiohttp
import dotenv
from rich.console import Console
from rich.progress import Progress, TaskID
from tenacity import retry, stop_after_attempt, wait_exponential
from PIL import Image
import sanity

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sanity_migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
console = Console()

# Load environment variables
dotenv.load_dotenv()

# Sanity client configuration
sanity_config = {
    "projectId": os.getenv("SANITY_PROJECT_ID"),
    "dataset": os.getenv("SANITY_DATASET"),
    "apiVersion": "2025-05-23",
    "token": os.getenv("SANITY_TOKEN"),
}

class ImageMigrationError(Exception):
    """Custom exception for image migration errors"""
    pass

class SanityImageMigration:
    def __init__(self):
        self.client = sanity.Client(**sanity_config)
        self.session: Optional[aiohttp.ClientSession] = None
        self.progress: Optional[Progress] = None
        self.stats = {
            "processed": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def download_image(self, url: str, task_id: TaskID) -> Optional[Path]:
        """Download an image from URL with retry logic"""
        if not self.session:
            raise ImageMigrationError("HTTP session not initialized")

        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    # Create temp directory if it doesn't exist
                    temp_dir = Path("temp_images")
                    temp_dir.mkdir(exist_ok=True)

                    # Create filename from URL
                    filename = Path(urlparse(url).path).name or "image.jpg"
                    filepath = temp_dir / filename

                    # Save image
                    with open(filepath, 'wb') as f:
                        while chunk := await response.content.read(8192):
                            f.write(chunk)
                            if self.progress:
                                self.progress.update(task_id, advance=len(chunk))

                    return filepath
                else:
                    logger.error(f"Failed to download image from {url}. Status: {response.status}")
                    return None

        except Exception as e:
            logger.error(f"Error downloading image from {url}: {str(e)}")
            raise ImageMigrationError(f"Failed to download image: {str(e)}")

    async def process_image(self, image_path: Path) -> Dict[str, Any]:
        """Process an image and prepare it for Sanity upload"""
        try:
            with Image.open(image_path) as img:
                width, height = img.size
                return {
                    "dimensions": {"width": width, "height": height},
                    "path": image_path,
                    "mime_type": Image.MIME[img.format] if img.format else "image/jpeg"
                }
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            raise ImageMigrationError(f"Failed to process image: {str(e)}")

    async def upload_to_sanity(self, image_data: Dict[str, Any]) -> Dict[str, Any]:
        """Upload processed image to Sanity"""
        try:
            with open(image_data["path"], "rb") as f:
                # Upload to Sanity
                asset = await self.client.assets.upload("image", f)

                # Create proper Sanity reference
                return {
                    "asset": {
                        "_type": "reference",
                        "_ref": asset["_id"]
                    },
                    "metadata": {
                        "dimensions": image_data["dimensions"]
                    }
                }
        except Exception as e:
            logger.error(f"Error uploading to Sanity: {str(e)}")
            raise ImageMigrationError(f"Failed to upload to Sanity: {str(e)}")

    async def migrate_images(self, csv_path: Path):
        """Main migration function"""
        try:
            # Load image data from CSV
            with open(csv_path, 'r') as f:
                reader = csv.DictReader(f)
                images_data = list(reader)

            with Progress() as progress:
                self.progress = progress

                # Create progress bars
                overall_task = progress.add_task("[green]Overall Progress", total=len(images_data))
                current_task = progress.add_task("[blue]Current Image", total=100)

                for row in images_data:
                    try:
                        # Download image
                        image_path = await self.download_image(row["primary_image_url"], current_task)
                        if not image_path:
                            self.stats["failed"] += 1
                            continue

                        # Process image
                        image_data = await self.process_image(image_path)

                        # Upload to Sanity
                        sanity_asset = await self.upload_to_sanity(image_data)

                        # Update listing document in Sanity
                        await self.client.patch(row["id"]).set({
                            "mainImage": sanity_asset
                        }).commit()

                        self.stats["successful"] += 1

                    except ImageMigrationError as e:
                        logger.error(f"Failed to process {row['id']}: {str(e)}")
                        self.stats["failed"] += 1
                        continue
                    finally:
                        self.stats["processed"] += 1
                        progress.update(overall_task, advance=1)

                        # Cleanup temp file
                        if image_path and image_path.exists():
                            image_path.unlink()

        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            raise

        finally:
            # Log final statistics
            logger.info(f"Migration completed. Stats: {json.dumps(self.stats, indent=2)}")

async def main():
    """Main entry point"""
    try:
        csv_path = Path("image_curation_helper.csv")
        if not csv_path.exists():
            raise FileNotFoundError(f"CSV file not found: {csv_path}")

        async with SanityImageMigration() as migrator:
            await migrator.migrate_images(csv_path)

    except Exception as e:
        logger.error(f"Migration script failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
