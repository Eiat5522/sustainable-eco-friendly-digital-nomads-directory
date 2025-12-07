"""
Test script for Sanity image migration functionality
"""

import asyncio
import pytest
from pathlib import Path
from unittest.mock import Mock, patch
from sanity_image_migration import SanityImageMigration, ImageMigrationError

@pytest.fixture
def mock_sanity_client():
    return Mock()

@pytest.fixture
def mock_aiohttp_session():
    return Mock()

@pytest.fixture
async def migration_instance(mock_sanity_client, mock_aiohttp_session):
    with patch('sanity_image_migration.sanity.Client', return_value=mock_sanity_client):
        migration = SanityImageMigration()
        migration.session = mock_aiohttp_session
        return migration

@pytest.mark.asyncio
async def test_download_image_success(migration_instance, tmp_path):
    # Prepare test data
    url = "https://example.com/test.jpg"
    mock_response = Mock()
    mock_response.status = 200
    mock_response.content.read = Mock(side_effect=[b"test_data", b""])

    migration_instance.session.get.return_value.__aenter__.return_value = mock_response

    # Execute
    result = await migration_instance.download_image(url, None)

    # Assert
    assert result is not None
    assert result.exists()
    assert migration_instance.session.get.called_with(url)

@pytest.mark.asyncio
async def test_download_image_failure(migration_instance):
    # Prepare test data
    url = "https://example.com/nonexistent.jpg"
    mock_response = Mock()
    mock_response.status = 404

    migration_instance.session.get.return_value.__aenter__.return_value = mock_response

    # Execute & Assert
    with pytest.raises(ImageMigrationError):
        await migration_instance.download_image(url, None)

@pytest.mark.asyncio
async def test_process_image(migration_instance, tmp_path):
    # Create a test image
    test_image = tmp_path / "test.jpg"
    test_image.write_bytes(b"test_image_data")

    with patch('PIL.Image.open') as mock_open:
        mock_image = Mock()
        mock_image.size = (100, 100)
        mock_image.format = "JPEG"
        mock_open.return_value.__enter__.return_value = mock_image

        # Execute
        result = await migration_instance.process_image(test_image)

        # Assert
        assert result["dimensions"]["width"] == 100
        assert result["dimensions"]["height"] == 100
        assert result["mime_type"] == "image/jpeg"

@pytest.mark.asyncio
async def test_upload_to_sanity(migration_instance, tmp_path):
    # Prepare test data
    test_image = tmp_path / "test.jpg"
    test_image.write_bytes(b"test_image_data")

    image_data = {
        "path": test_image,
        "dimensions": {"width": 100, "height": 100}
    }

    mock_asset = {"_id": "test_asset_id"}
    migration_instance.client.assets.upload.return_value = mock_asset

    # Execute
    result = await migration_instance.upload_to_sanity(image_data)

    # Assert
    assert result["asset"]["_type"] == "reference"
    assert result["asset"]["_ref"] == "test_asset_id"
    assert result["metadata"]["dimensions"] == image_data["dimensions"]

@pytest.mark.asyncio
async def test_migrate_images_flow(migration_instance, tmp_path):
    # Create test CSV
    csv_content = """id,primary_image_url
1,https://example.com/image1.jpg
2,https://example.com/image2.jpg"""

    csv_path = tmp_path / "test.csv"
    csv_path.write_text(csv_content)

    # Mock successful responses
    mock_response = Mock()
    mock_response.status = 200
    mock_response.content.read = Mock(side_effect=[b"test_data", b""])
    migration_instance.session.get.return_value.__aenter__.return_value = mock_response

    # Mock Sanity responses
    migration_instance.client.assets.upload.return_value = {"_id": "test_asset_id"}
    migration_instance.client.patch.return_value.set.return_value.commit = Mock()

    # Execute
    await migration_instance.migrate_images(csv_path)

    # Assert
    assert migration_instance.stats["processed"] > 0
    assert migration_instance.stats["successful"] > 0
    assert migration_instance.stats["failed"] == 0

if __name__ == "__main__":
    pytest.main([__file__])
