"""
Migration Configuration
Sustainable Digital Nomads Directory - Workstream B

Configuration settings for the complete migration pipeline.
Modify these settings as needed for your specific requirements.
"""

from pathlib import Path
from typing import Dict, Any, List

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_FILE = PROJECT_ROOT / "image_curation_helper.csv"
LOGS_DIR = PROJECT_ROOT / "logs"
OUTPUT_DIR = PROJECT_ROOT / "migration_output"

# Sanity configuration
SANITY_CONFIG = {
    "project_id": "sc70w3cr",
    "dataset": "development",
    "api_version": "2025-05-24",
    "use_cdn": True,
    "timeout": 30,
    "retry_attempts": 3
}

# Image processing configuration
IMAGE_CONFIG = {
    # Size constraints
    "max_width": 2048,
    "max_height": 2048,
    "thumbnail_size": (400, 300),

    # Quality settings
    "jpeg_quality": 85,
    "webp_quality": 80,
    "png_compression": 6,

    # Processing options
    "auto_orient": True,
    "strip_metadata": True,
    "convert_to_rgb": True,
    "progressive_jpeg": True,

    # File size limits (in bytes)
    "max_file_size": 10 * 1024 * 1024,  # 10MB
    "min_file_size": 1024,  # 1KB

    # Supported formats
    "input_formats": ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'],
    "output_formats": {
        "primary": "JPEG",
        "thumbnail": "WEBP",
        "gallery": "JPEG"
    }
}

# Migration pipeline configuration
MIGRATION_CONFIG = {
    # Processing limits
    "max_concurrent_images": 5,
    "max_concurrent_uploads": 3,
    "batch_size": 20,

    # Retry settings
    "max_retries": 3,
    "retry_delay": 2,  # seconds
    "exponential_backoff": True,

    # Timeout settings
    "image_processing_timeout": 60,  # seconds
    "upload_timeout": 120,  # seconds

    # Error handling
    "continue_on_error": True,
    "save_failed_items": True,
    "create_rollback_plan": True
}

# Logging configuration
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file_rotation": True,
    "max_file_size": 10 * 1024 * 1024,  # 10MB
    "backup_count": 5,
    "console_output": True
}

# CSV field mappings
CSV_FIELD_MAPPING = {
    "id_field": "id",
    "name_field": "name",
    "primary_image_field": "primary_image_url",
    "gallery_images_field": "gallery_image_urls",
    "source_urls_field": "source_urls",
    "separator": ";"  # For multi-value fields
}

# Sanity document schema mapping
SANITY_SCHEMA_MAPPING = {
    "document_type": "listing",
    "required_fields": ["_type", "_id", "name"],
    "optional_fields": ["slug", "description", "location", "tags", "status"],
    "image_fields": {
        "primary": "primaryImage",
        "gallery": "gallery"
    },
    "reference_fields": {
        "source_urls": "sourceUrls"
    }
}

# Pre-migration checks
PRE_MIGRATION_CHECKS = [
    "verify_sanity_auth",
    "check_csv_file_exists",
    "validate_csv_structure",
    "test_image_processing",
    "check_disk_space",
    "verify_network_connection"
]

# Post-migration tasks
POST_MIGRATION_TASKS = [
    "generate_migration_report",
    "backup_processed_data",
    "validate_uploaded_assets",
    "create_rollback_instructions",
    "update_project_documentation"
]

def get_config() -> Dict[str, Any]:
    """Get complete configuration dictionary"""
    return {
        "project_root": PROJECT_ROOT,
        "csv_file": CSV_FILE,
        "logs_dir": LOGS_DIR,
        "output_dir": OUTPUT_DIR,
        "sanity": SANITY_CONFIG,
        "images": IMAGE_CONFIG,
        "migration": MIGRATION_CONFIG,
        "logging": LOGGING_CONFIG,
        "csv_mapping": CSV_FIELD_MAPPING,
        "sanity_schema": SANITY_SCHEMA_MAPPING,
        "pre_checks": PRE_MIGRATION_CHECKS,
        "post_tasks": POST_MIGRATION_TASKS
    }

def get_environment_variables() -> List[str]:
    """Get list of required environment variables"""
    return [
        "SANITY_STUDIO_PROJECT_ID",
        "SANITY_STUDIO_DATASET",
        "SANITY_STUDIO_API_VERSION",
        "SANITY_TEST_TOKEN",
        "SANITY_TOKEN"
    ]

def validate_configuration() -> Dict[str, Any]:
    """Validate configuration settings"""
    issues = []
    warnings = []

    # Check file paths
    if not CSV_FILE.exists():
        issues.append(f"CSV file not found: {CSV_FILE}")

    if not LOGS_DIR.exists():
        warnings.append(f"Logs directory will be created: {LOGS_DIR}")

    if not OUTPUT_DIR.exists():
        warnings.append(f"Output directory will be created: {OUTPUT_DIR}")

    # Check image configuration
    if IMAGE_CONFIG["max_width"] < 100 or IMAGE_CONFIG["max_height"] < 100:
        issues.append("Image dimensions too small")

    if IMAGE_CONFIG["jpeg_quality"] < 10 or IMAGE_CONFIG["jpeg_quality"] > 100:
        issues.append("JPEG quality must be between 10-100")

    # Check migration configuration
    if MIGRATION_CONFIG["max_concurrent_images"] < 1:
        issues.append("Must allow at least 1 concurrent image")

    if MIGRATION_CONFIG["max_retries"] < 0:
        issues.append("Max retries cannot be negative")

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings
    }

if __name__ == "__main__":
    # Test configuration
    config = get_config()
    validation = validate_configuration()

    print("🔧 Migration Configuration Test")
    print("=" * 40)
    print(f"📁 Project Root: {config['project_root']}")
    print(f"📊 CSV File: {config['csv_file']}")
    print(f"📂 Logs Directory: {config['logs_dir']}")
    print(f"📂 Output Directory: {config['output_dir']}")
    print()

    if validation["valid"]:
        print("✅ Configuration is valid")
    else:
        print("❌ Configuration has issues:")
        for issue in validation["issues"]:
            print(f"  - {issue}")

    if validation["warnings"]:
        print("⚠️ Warnings:")
        for warning in validation["warnings"]:
            print(f"  - {warning}")

    print("\n🔐 Required Environment Variables:")
    for var in get_environment_variables():
        print(f"  - {var}")
