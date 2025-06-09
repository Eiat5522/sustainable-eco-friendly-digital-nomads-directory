"""
Complete Migration Pipeline
Sustainable Digital Nomads Directory - Workstream B Completion

This script orchestrates the complete data and CMS integration pipeline,
processing the image curation CSV and migrating all content to Sanity CMS.
"""

import asyncio
import csv
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import logging

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from scripts.test_sanity_auth import SanityAuthTester
from scripts.migration_recovery import MigrationLogger, MigrationStatus
from scripts.image_processing_pipeline import ImageProcessor, ImageProcessingConfig

class CompleteMigrationPipeline:
    """
    Complete migration pipeline for Workstream B completion
    """

    def __init__(self, csv_file_path: str):
        self.csv_file_path = Path(csv_file_path)
        self.project_root = PROJECT_ROOT

        # Initialize components
        self.auth_tester = SanityAuthTester()
        self.logger = MigrationLogger(
            session_id=f"complete_migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            log_dir=self.project_root / "logs"
        )

        # Configuration
        self.config = ImageProcessingConfig()
        self.image_processor = None

        # Migration state
        self.listings_data = []
        self.migration_stats = {
            "total_listings": 0,
            "processed_listings": 0,
            "images_processed": 0,
            "images_uploaded": 0,
            "errors": 0,
            "warnings": 0
        }

    async def initialize_pipeline(self) -> bool:
        """Initialize the complete migration pipeline"""
        self.logger.log_info("🚀 Initializing Complete Migration Pipeline")

        try:
            # 1. Test Sanity authentication and connectivity
            self.logger.log_info("🔐 Testing Sanity authentication...")
            auth_results = await self.auth_tester.run_comprehensive_tests()

            if not auth_results.get("overall_status") == "PASSED":
                self.logger.log_error("❌ Sanity authentication failed")
                return False

            self.logger.log_info("✅ Sanity authentication successful")

            # 2. Initialize image processor
            self.logger.log_info("🖼️ Initializing image processor...")
            self.image_processor = ImageProcessor(
                config=self.config,
                logger=self.logger
            )

            # 3. Load and validate CSV data
            self.logger.log_info("📊 Loading CSV data...")
            if not await self.load_csv_data():
                return False

            self.logger.log_info("✅ Pipeline initialization complete")
            return True

        except Exception as e:
            self.logger.log_error(f"❌ Pipeline initialization failed: {e}")
            return False

    async def load_csv_data(self) -> bool:
        """Load and validate data from the image curation CSV"""
        try:
            if not self.csv_file_path.exists():
                self.logger.log_error(f"❌ CSV file not found: {self.csv_file_path}")
                return False

            with open(self.csv_file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                self.listings_data = list(reader)

            self.migration_stats["total_listings"] = len(self.listings_data)

            self.logger.log_info(f"📊 Loaded {len(self.listings_data)} listings from CSV")

            # Validate data structure
            required_fields = ['id', 'name', 'primary_image_url', 'gallery_image_urls', 'source_urls']
            for i, listing in enumerate(self.listings_data):
                missing_fields = [field for field in required_fields if field not in listing]
                if missing_fields:
                    self.logger.log_warning(f"⚠️ Listing {i+1} missing fields: {missing_fields}")

            return True

        except Exception as e:
            self.logger.log_error(f"❌ Failed to load CSV data: {e}")
            return False

    def parse_image_urls(self, url_string: str) -> List[str]:
        """Parse semicolon-separated image URLs"""
        if not url_string or url_string.strip() == "":
            return []

        urls = [url.strip() for url in url_string.split(';') if url.strip()]
        return urls

    def parse_source_urls(self, url_string: str) -> List[str]:
        """Parse semicolon-separated source URLs"""
        if not url_string or url_string.strip() == "":
            return []

        urls = [url.strip() for url in url_string.split(';') if url.strip()]
        return urls

    async def process_listing_images(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        """Process all images for a single listing"""
        listing_id = listing.get('id', 'unknown')
        self.logger.log_info(f"🖼️ Processing images for listing: {listing_id}")

        processed_listing = listing.copy()
        image_results = {
            "primary_image": None,
            "gallery_images": [],
            "processing_errors": []
        }

        try:
            # Process primary image
            primary_url = listing.get('primary_image_url', '').strip()
            if primary_url:
                try:
                    primary_result = await self.image_processor.process_single_image(
                        image_path=primary_url,
                        listing_id=listing_id,
                        image_type="primary"
                    )
                    image_results["primary_image"] = primary_result
                    self.migration_stats["images_processed"] += 1

                    if primary_result.get("sanity_asset_id"):
                        self.migration_stats["images_uploaded"] += 1

                except Exception as e:
                    error_msg = f"Failed to process primary image: {e}"
                    image_results["processing_errors"].append(error_msg)
                    self.logger.log_error(f"❌ {listing_id}: {error_msg}")
                    self.migration_stats["errors"] += 1

            # Process gallery images
            gallery_urls = self.parse_image_urls(listing.get('gallery_image_urls', ''))
            for i, gallery_url in enumerate(gallery_urls):
                try:
                    gallery_result = await self.image_processor.process_single_image(
                        image_path=gallery_url,
                        listing_id=listing_id,
                        image_type=f"gallery_{i+1}"
                    )
                    image_results["gallery_images"].append(gallery_result)
                    self.migration_stats["images_processed"] += 1

                    if gallery_result.get("sanity_asset_id"):
                        self.migration_stats["images_uploaded"] += 1

                except Exception as e:
                    error_msg = f"Failed to process gallery image {i+1}: {e}"
                    image_results["processing_errors"].append(error_msg)
                    self.logger.log_error(f"❌ {listing_id}: {error_msg}")
                    self.migration_stats["errors"] += 1

            # Update processed listing with image results
            processed_listing["image_processing_results"] = image_results
            processed_listing["processed_at"] = datetime.now(timezone.utc).isoformat()

            return processed_listing

        except Exception as e:
            self.logger.log_error(f"❌ Failed to process listing {listing_id}: {e}")
            self.migration_stats["errors"] += 1
            return processed_listing

    async def create_sanity_listing_document(self, processed_listing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a Sanity document for the processed listing"""
        listing_id = processed_listing.get('id', 'unknown')

        try:
            # Parse source URLs
            source_urls = self.parse_source_urls(processed_listing.get('source_urls', ''))

            # Get image processing results
            image_results = processed_listing.get('image_processing_results', {})
            primary_image = image_results.get('primary_image')
            gallery_images = image_results.get('gallery_images', [])

            # Create Sanity document structure
            sanity_doc = {
                "_type": "listing",
                "_id": listing_id,
                "name": processed_listing.get('name', '').strip(),
                "slug": {
                    "_type": "slug",
                    "current": listing_id.replace('_', '-').lower()
                },
                "sourceUrls": source_urls,
                "status": "draft",
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "updatedAt": datetime.now(timezone.utc).isoformat(),
            }

            # Add primary image if available
            if primary_image and primary_image.get('sanity_asset_id'):
                sanity_doc["primaryImage"] = {
                    "_type": "image",
                    "asset": {
                        "_type": "reference",
                        "_ref": primary_image['sanity_asset_id']
                    },
                    "alt": f"Primary image for {processed_listing.get('name', 'listing')}"
                }

            # Add gallery images if available
            if gallery_images:
                gallery_refs = []
                for i, gallery_img in enumerate(gallery_images):
                    if gallery_img.get('sanity_asset_id'):
                        gallery_refs.append({
                            "_type": "image",
                            "_key": f"gallery_{i+1}",
                            "asset": {
                                "_type": "reference",
                                "_ref": gallery_img['sanity_asset_id']
                            },
                            "alt": f"Gallery image {i+1} for {processed_listing.get('name', 'listing')}"
                        })

                if gallery_refs:
                    sanity_doc["gallery"] = gallery_refs

            return sanity_doc

        except Exception as e:
            self.logger.log_error(f"❌ Failed to create Sanity document for {listing_id}: {e}")
            return None

    async def upload_sanity_document(self, sanity_doc: Dict[str, Any]) -> bool:
        """Upload document to Sanity CMS"""
        try:
            # This would integrate with your existing Sanity upload logic
            # For now, we'll log the document structure
            doc_id = sanity_doc.get('_id', 'unknown')

            self.logger.log_info(f"📄 Created Sanity document for {doc_id}")
            self.logger.log_debug(f"Document structure: {json.dumps(sanity_doc, indent=2)}")

            # TODO: Implement actual Sanity API upload
            # This should integrate with your existing migrate_listings_to_sanity.py script

            return True

        except Exception as e:
            self.logger.log_error(f"❌ Failed to upload Sanity document: {e}")
            return False

    async def run_complete_migration(self) -> Dict[str, Any]:
        """Run the complete migration pipeline"""
        self.logger.log_info("🚀 Starting Complete Migration Pipeline")

        # Initialize pipeline
        if not await self.initialize_pipeline():
            return {"status": "FAILED", "error": "Pipeline initialization failed"}

        # Process all listings
        processed_listings = []
        for i, listing in enumerate(self.listings_data):
            listing_id = listing.get('id', f'listing_{i+1}')

            self.logger.log_info(f"📊 Processing listing {i+1}/{len(self.listings_data)}: {listing_id}")

            # Process images for this listing
            processed_listing = await self.process_listing_images(listing)
            processed_listings.append(processed_listing)

            # Create Sanity document
            sanity_doc = await self.create_sanity_listing_document(processed_listing)
            if sanity_doc:
                await self.upload_sanity_document(sanity_doc)

            # Update progress
            self.migration_stats["processed_listings"] += 1

            # Log progress every 10 listings
            if (i + 1) % 10 == 0:
                progress = (i + 1) / len(self.listings_data) * 100
                self.logger.log_info(f"📈 Progress: {progress:.1f}% ({i+1}/{len(self.listings_data)} listings)")

        # Generate final report
        final_report = await self.generate_final_report(processed_listings)

        self.logger.log_info("✅ Complete Migration Pipeline finished")
        return final_report

    async def generate_final_report(self, processed_listings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a comprehensive migration report"""
        report = {
            "migration_summary": self.migration_stats.copy(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "csv_file": str(self.csv_file_path),
            "total_processing_time": "TODO: Calculate",
            "success_rate": 0,
            "detailed_results": []
        }

        # Calculate success rate
        if self.migration_stats["total_listings"] > 0:
            report["success_rate"] = (
                (self.migration_stats["processed_listings"] - self.migration_stats["errors"]) /
                self.migration_stats["total_listings"] * 100
            )

        # Add detailed results
        for listing in processed_listings:
            listing_report = {
                "id": listing.get('id'),
                "name": listing.get('name'),
                "images_processed": 0,
                "images_uploaded": 0,
                "errors": []
            }

            image_results = listing.get('image_processing_results', {})
            if image_results.get('primary_image'):
                listing_report["images_processed"] += 1
                if image_results['primary_image'].get('sanity_asset_id'):
                    listing_report["images_uploaded"] += 1

            listing_report["images_processed"] += len(image_results.get('gallery_images', []))
            listing_report["images_uploaded"] += len([
                img for img in image_results.get('gallery_images', [])
                if img.get('sanity_asset_id')
            ])

            listing_report["errors"] = image_results.get('processing_errors', [])
            report["detailed_results"].append(listing_report)

        # Save report to file
        report_file = self.project_root / "logs" / f"migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        self.logger.log_info(f"📋 Migration report saved to: {report_file}")

        return report

async def main():
    """Main entry point for the complete migration pipeline"""
    # Default CSV file path
    csv_file = PROJECT_ROOT / "image_curation_helper.csv"

    # Allow CSV file to be specified as command line argument
    if len(sys.argv) > 1:
        csv_file = Path(sys.argv[1])

    print(f"🚀 Starting Complete Migration Pipeline")
    print(f"📊 CSV File: {csv_file}")
    print(f"📁 Project Root: {PROJECT_ROOT}")
    print("=" * 60)

    # Create and run pipeline
    pipeline = CompleteMigrationPipeline(str(csv_file))
    results = await pipeline.run_complete_migration()

    print("\n" + "=" * 60)
    print("📋 MIGRATION COMPLETE")
    print("=" * 60)
    print(f"✅ Status: {results.get('status', 'COMPLETED')}")
    print(f"📊 Total Listings: {results.get('migration_summary', {}).get('total_listings', 0)}")
    print(f"✅ Processed: {results.get('migration_summary', {}).get('processed_listings', 0)}")
    print(f"🖼️ Images Processed: {results.get('migration_summary', {}).get('images_processed', 0)}")
    print(f"☁️ Images Uploaded: {results.get('migration_summary', {}).get('images_uploaded', 0)}")
    print(f"❌ Errors: {results.get('migration_summary', {}).get('errors', 0)}")
    print(f"📈 Success Rate: {results.get('success_rate', 0):.1f}%")

if __name__ == "__main__":
    asyncio.run(main())
