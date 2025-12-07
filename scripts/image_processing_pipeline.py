"""
Enhanced Image Processing Pipeline
Sustainable Digital Nomads Directory - Image Optimization & Upload

This module provides comprehensive image processing, optimization,
and batch upload capabilities for the Sanity CMS migration.
"""

import asyncio
import aiohttp
import aiofiles
import io
import hashlib
import mimetypes
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
from PIL import Image, ImageOps, ExifTags
from datetime import datetime, timezone
import logging
from dataclasses import dataclass
import json

from migration_recovery import (
    MigrationLogger, MigrationErrorType, MigrationStatus,
    create_migration_error, retry_on_error
)

@dataclass
class ImageProcessingConfig:
    """Configuration for image processing operations"""
    # Size constraints
    max_width: int = 2048
    max_height: int = 2048
    thumbnail_size: Tuple[int, int] = (400, 300)

    # Quality settings
    jpeg_quality: int = 85
    webp_quality: int = 80
    png_compression: int = 6

    # Processing options
    auto_orient: bool = True
    strip_metadata: bool = True
    convert_to_rgb: bool = True
    progressive_jpeg: bool = True

    # File size limits (in bytes)
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    min_file_size: int = 1024  # 1KB

    # Supported formats
    supported_formats: Tuple[str, ...] = ('JPEG', 'PNG', 'WEBP', 'GIF')
    output_format: str = 'JPEG'  # Default output format

@dataclass
class ProcessedImage:
    """Container for processed image data and metadata"""
    original_path: Path
    processed_data: bytes
    format: str
    mime_type: str
    dimensions: Tuple[int, int]
    file_size: int
    checksum: str
    thumbnail_data: Optional[bytes] = None
    metadata: Dict[str, Any] = None

class ImageProcessor:
    """Advanced image processing with optimization and validation"""

    def __init__(self, config: ImageProcessingConfig = None):
        self.config = config or ImageProcessingConfig()
        self.logger = logging.getLogger(__name__)

    def validate_image(self, image_path: Path) -> Tuple[bool, Optional[str]]:
        """Validate image file before processing"""

        if not image_path.exists():
            return False, "File does not exist"

        if image_path.stat().st_size == 0:
            return False, "File is empty"

        if image_path.stat().st_size > self.config.max_file_size:
            return False, f"File too large: {image_path.stat().st_size} bytes"

        if image_path.stat().st_size < self.config.min_file_size:
            return False, f"File too small: {image_path.stat().st_size} bytes"

        try:
            with Image.open(image_path) as img:
                # Check format
                if img.format not in self.config.supported_formats:
                    return False, f"Unsupported format: {img.format}"

                # Check dimensions
                width, height = img.size
                if width == 0 or height == 0:
                    return False, "Invalid dimensions"

                # Verify image integrity
                img.verify()

            return True, None

        except Exception as e:
            return False, f"Image validation failed: {str(e)}"

    def process_image(self, image_path: Path,
                     custom_config: Optional[ImageProcessingConfig] = None) -> ProcessedImage:
        """Process image with optimization and standardization"""

        config = custom_config or self.config

        # Validate image first
        is_valid, error_msg = self.validate_image(image_path)
        if not is_valid:
            raise ValueError(f"Image validation failed: {error_msg}")

        try:
            with Image.open(image_path) as img:
                # Store original dimensions
                original_size = img.size

                # Auto-orient based on EXIF data
                if config.auto_orient:
                    img = ImageOps.exif_transpose(img)

                # Convert to RGB if needed
                if config.convert_to_rgb and img.mode in ('RGBA', 'P', 'LA'):
                    # Create white background for transparency
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = rgb_img

                # Resize if necessary
                if img.size[0] > config.max_width or img.size[1] > config.max_height:
                    img.thumbnail((config.max_width, config.max_height), Image.Resampling.LANCZOS)

                # Prepare save options
                save_options = self._get_save_options(config)

                # Save processed image to bytes
                output_buffer = io.BytesIO()
                img.save(output_buffer, format=config.output_format, **save_options)
                processed_data = output_buffer.getvalue()

                # Generate thumbnail
                thumbnail_data = None
                if config.thumbnail_size:
                    thumbnail_data = self._create_thumbnail(img, config.thumbnail_size, config)

                # Calculate checksum
                checksum = hashlib.sha256(processed_data).hexdigest()

                # Get mime type
                mime_type = f"image/{config.output_format.lower()}"
                if config.output_format == 'JPEG':
                    mime_type = "image/jpeg"

                # Collect metadata
                metadata = {
                    "original_size": original_size,
                    "processed_size": img.size,
                    "original_format": img.format,
                    "processing_timestamp": datetime.now(timezone.utc).isoformat(),
                    "config_used": {
                        "max_width": config.max_width,
                        "max_height": config.max_height,
                        "quality": getattr(config, f"{config.output_format.lower()}_quality", 85)
                    }
                }

                return ProcessedImage(
                    original_path=image_path,
                    processed_data=processed_data,
                    format=config.output_format,
                    mime_type=mime_type,
                    dimensions=img.size,
                    file_size=len(processed_data),
                    checksum=checksum,
                    thumbnail_data=thumbnail_data,
                    metadata=metadata
                )

        except Exception as e:
            self.logger.error(f"Image processing failed for {image_path}: {str(e)}")
            raise

    def _get_save_options(self, config: ImageProcessingConfig) -> Dict[str, Any]:
        """Get format-specific save options"""

        if config.output_format == 'JPEG':
            return {
                'quality': config.jpeg_quality,
                'optimize': True,
                'progressive': config.progressive_jpeg
            }
        elif config.output_format == 'PNG':
            return {
                'optimize': True,
                'compress_level': config.png_compression
            }
        elif config.output_format == 'WEBP':
            return {
                'quality': config.webp_quality,
                'optimize': True
            }
        else:
            return {}

    def _create_thumbnail(self, img: Image.Image, size: Tuple[int, int],
                         config: ImageProcessingConfig) -> bytes:
        """Create thumbnail from processed image"""

        # Create copy for thumbnail
        thumb = img.copy()
        thumb.thumbnail(size, Image.Resampling.LANCZOS)

        # Save thumbnail
        thumb_buffer = io.BytesIO()
        save_options = self._get_save_options(config)
        thumb.save(thumb_buffer, format=config.output_format, **save_options)

        return thumb_buffer.getvalue()

class BatchImageProcessor:
    """Batch processing of images with progress tracking and error recovery"""

    def __init__(self, migration_logger: MigrationLogger,
                 processing_config: ImageProcessingConfig = None,
                 max_concurrent: int = 4):
        self.migration_logger = migration_logger
        self.processor = ImageProcessor(processing_config)
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)

        self.stats = {
            "total_images": 0,
            "processed": 0,
            "failed": 0,
            "skipped": 0,
            "total_size_before": 0,
            "total_size_after": 0
        }

    async def process_images_batch(self, image_paths: List[Path],
                                  output_dir: Optional[Path] = None) -> List[ProcessedImage]:
        """Process multiple images concurrently"""

        self.stats["total_images"] = len(image_paths)
        self.migration_logger.logger.info(f"Starting batch processing of {len(image_paths)} images")

        # Create output directory if specified
        if output_dir:
            output_dir.mkdir(parents=True, exist_ok=True)

        # Process images concurrently
        tasks = [
            self._process_single_image(image_path, output_dir)
            for image_path in image_paths
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Separate successful results from exceptions
        processed_images = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self.migration_logger.logger.error(
                    f"Failed to process {image_paths[i]}: {str(result)}"
                )
                self.stats["failed"] += 1
            elif result:
                processed_images.append(result)
                self.stats["processed"] += 1
            else:
                self.stats["skipped"] += 1

        # Log final statistics
        self._log_batch_statistics()

        return processed_images

    async def _process_single_image(self, image_path: Path,
                                   output_dir: Optional[Path]) -> Optional[ProcessedImage]:
        """Process a single image with semaphore control"""

        async with self.semaphore:
            try:
                # Add to migration tracking
                item_id = f"image_{image_path.stem}_{int(datetime.now().timestamp())}"
                self.migration_logger.add_item(
                    item_id=item_id,
                    item_type="image",
                    data={"path": str(image_path), "name": image_path.name}
                )

                # Process image
                processed = await asyncio.get_event_loop().run_in_executor(
                    None, self.processor.process_image, image_path
                )

                # Save to output directory if specified
                if output_dir:
                    output_path = output_dir / f"{image_path.stem}_processed.jpg"
                    async with aiofiles.open(output_path, 'wb') as f:
                        await f.write(processed.processed_data)

                # Update statistics
                self.stats["total_size_before"] += image_path.stat().st_size
                self.stats["total_size_after"] += processed.file_size

                # Update migration status
                self.migration_logger.update_item_status(item_id, MigrationStatus.SUCCESS)

                return processed

            except Exception as e:
                # Create structured error
                error = create_migration_error(
                    error_type=MigrationErrorType.IMAGE_PROCESSING_ERROR,
                    message=f"Image processing failed: {str(e)}",
                    context={"image_path": str(image_path)},
                    exception=e
                )

                # Update migration status
                self.migration_logger.update_item_status(item_id, MigrationStatus.FAILED, error)

                return None

    def _log_batch_statistics(self):
        """Log batch processing statistics"""

        compression_ratio = 0
        if self.stats["total_size_before"] > 0:
            compression_ratio = (
                1 - self.stats["total_size_after"] / self.stats["total_size_before"]
            ) * 100

        self.migration_logger.logger.info(
            f"Batch processing completed: "
            f"{self.stats['processed']} processed, "
            f"{self.stats['failed']} failed, "
            f"{self.stats['skipped']} skipped"
        )

        if compression_ratio > 0:
            self.migration_logger.logger.info(
                f"Size reduction: {compression_ratio:.1f}% "
                f"({self.stats['total_size_before']} -> {self.stats['total_size_after']} bytes)"
            )

class SanityImageUploader:
    """Async image uploader with retry logic and progress tracking"""

    def __init__(self, sanity_client, migration_logger: MigrationLogger,
                 max_concurrent_uploads: int = 3):
        self.sanity_client = sanity_client
        self.migration_logger = migration_logger
        self.max_concurrent = max_concurrent_uploads
        self.semaphore = asyncio.Semaphore(max_concurrent_uploads)

        self.upload_stats = {
            "total_uploads": 0,
            "successful_uploads": 0,
            "failed_uploads": 0,
            "bytes_uploaded": 0
        }

    @retry_on_error(max_attempts=3, backoff_factor=2.0)
    async def upload_image(self, processed_image: ProcessedImage,
                          filename: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Upload processed image to Sanity with retry logic"""

        async with self.semaphore:
            try:
                item_id = f"upload_{processed_image.checksum[:8]}"
                self.migration_logger.add_item(
                    item_id=item_id,
                    item_type="upload",
                    data={
                        "original_path": str(processed_image.original_path),
                        "file_size": processed_image.file_size,
                        "checksum": processed_image.checksum
                    }
                )

                # Prepare filename
                if not filename:
                    filename = f"{processed_image.original_path.stem}_processed.{processed_image.format.lower()}"

                # Upload to Sanity
                asset_response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    self.sanity_client.assets_upload,
                    processed_image.processed_data,
                    processed_image.mime_type,
                    filename
                )

                if asset_response and '_id' in asset_response:
                    # Update statistics
                    self.upload_stats["successful_uploads"] += 1
                    self.upload_stats["bytes_uploaded"] += processed_image.file_size

                    # Update migration status
                    self.migration_logger.update_item_status(item_id, MigrationStatus.SUCCESS)

                    self.migration_logger.logger.info(
                        f"Successfully uploaded {filename} (ID: {asset_response['_id']})"
                    )

                    return {
                        "_type": "image",
                        "asset": {
                            "_type": "reference",
                            "_ref": asset_response['_id']
                        },
                        "metadata": {
                            "dimensions": {
                                "width": processed_image.dimensions[0],
                                "height": processed_image.dimensions[1]
                            },
                            "checksum": processed_image.checksum,
                            "original_filename": processed_image.original_path.name
                        }
                    }
                else:
                    raise Exception("Invalid response from Sanity asset upload")

            except Exception as e:
                self.upload_stats["failed_uploads"] += 1

                # Create structured error
                error = create_migration_error(
                    error_type=MigrationErrorType.SANITY_API_ERROR,
                    message=f"Image upload failed: {str(e)}",
                    context={
                        "filename": filename,
                        "file_size": processed_image.file_size,
                        "checksum": processed_image.checksum
                    },
                    exception=e
                )

                # Update migration status
                self.migration_logger.update_item_status(item_id, MigrationStatus.FAILED, error)

                self.migration_logger.logger.error(f"Failed to upload {filename}: {str(e)}")
                raise

    async def upload_images_batch(self, processed_images: List[ProcessedImage]) -> List[Dict[str, Any]]:
        """Upload multiple processed images concurrently"""

        self.upload_stats["total_uploads"] = len(processed_images)
        self.migration_logger.logger.info(f"Starting batch upload of {len(processed_images)} images")

        # Upload images concurrently
        tasks = [
            self.upload_image(processed_image)
            for processed_image in processed_images
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter successful uploads
        successful_uploads = []
        for result in results:
            if isinstance(result, Exception):
                continue
            elif result:
                successful_uploads.append(result)

        # Log upload statistics
        self.migration_logger.logger.info(
            f"Batch upload completed: "
            f"{self.upload_stats['successful_uploads']} successful, "
            f"{self.upload_stats['failed_uploads']} failed, "
            f"{self.upload_stats['bytes_uploaded']} bytes uploaded"
        )

        return successful_uploads

def create_processing_config(quality_preset: str = "standard") -> ImageProcessingConfig:
    """Create image processing configuration based on quality preset"""

    presets = {
        "high": ImageProcessingConfig(
            max_width=3000,
            max_height=3000,
            jpeg_quality=95,
            webp_quality=90,
            png_compression=3
        ),
        "standard": ImageProcessingConfig(
            max_width=2048,
            max_height=2048,
            jpeg_quality=85,
            webp_quality=80,
            png_compression=6
        ),
        "optimized": ImageProcessingConfig(
            max_width=1500,
            max_height=1500,
            jpeg_quality=75,
            webp_quality=70,
            png_compression=9
        )
    }

    return presets.get(quality_preset, presets["standard"])

async def process_and_upload_images(image_paths: List[Path],
                                  sanity_client,
                                  migration_logger: MigrationLogger,
                                  quality_preset: str = "standard") -> List[Dict[str, Any]]:
    """Complete pipeline: process and upload images"""

    # Create processing configuration
    config = create_processing_config(quality_preset)

    # Initialize processors
    batch_processor = BatchImageProcessor(migration_logger, config)
    uploader = SanityImageUploader(sanity_client, migration_logger)

    # Process images
    processed_images = await batch_processor.process_images_batch(image_paths)

    if not processed_images:
        migration_logger.logger.warning("No images were successfully processed")
        return []

    # Upload processed images
    uploaded_assets = await uploader.upload_images_batch(processed_images)

    migration_logger.logger.info(
        f"Pipeline completed: {len(uploaded_assets)} images successfully uploaded"
    )

    return uploaded_assets
