import json
import os
import re
import requests
import time
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class SanityAPIError(Exception):
    """Custom exception for Sanity API errors"""
    def __init__(self, message: str, response: Optional[requests.Response] = None):
        super().__init__(message)
        self.response = response

class SanityTransaction:
    def __init__(self, client):
        self.client = client
        self.mutations: List[Dict[str, Any]] = []
        self.transaction_id = None

    def create(self, document: Dict[str, Any]) -> 'SanityTransaction':
        """Add a create mutation to the transaction"""
        self.mutations.append({"create": document})
        return self

    def create_or_replace(self, document: Dict[str, Any]) -> 'SanityTransaction':
        """Add a createOrReplace mutation to the transaction"""
        self.mutations.append({"createOrReplace": document})
        return self

    def patch(self, document_id: str, set_patch: Optional[Dict] = None, unset: Optional[List[str]] = None) -> 'SanityTransaction':
        """Add a patch mutation to the transaction"""
        patch = {"id": document_id}
        if set_patch:
            patch["set"] = set_patch
        if unset:
            patch["unset"] = unset
        self.mutations.append({"patch": patch})
        return self

    def delete(self, document_id: str) -> 'SanityTransaction':
        """Add a delete mutation to the transaction"""
        self.mutations.append({"delete": {"id": document_id}})
        return self

    def commit(self, return_docs: bool = False) -> Dict[str, Any]:
        """Commit the transaction"""
        return self.client.commit_transaction(self.mutations, return_docs)

class SanityClient:
    def __init__(self, project_id: str, dataset: str, token: str, api_version: str, use_cdn: bool = False):
        self.project_id = project_id
        self.dataset = dataset
        self.token = token
        self.api_version = api_version
        self.base_url = f"https://{project_id}.api.sanity.io/v{api_version}/data"
        self.cdn_url = f"https://{project_id}.apicdn.sanity.io/v{api_version}/data" if use_cdn else None
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Configure retry strategy
        retry_strategy = Retry(
            total=3,  # number of retries
            backoff_factor=1,  # wait 1, 2, 4 seconds between retries
            status_forcelist=[408, 429, 500, 502, 503, 504]  # HTTP status codes to retry on
        )
        self.session = requests.Session()
        self.session.mount("https://", HTTPAdapter(max_retries=retry_strategy))
        self.session.headers.update(self.headers)

    def _make_request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
        """Make a request with retry logic and error handling"""
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RetryError as e:
            raise SanityAPIError(f"Max retries exceeded: {str(e)}")
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                raise SanityAPIError(
                    f"API request failed: {str(e)}",
                    response=e.response
                )
            raise SanityAPIError(f"Request failed: {str(e)}")

    def transaction(self) -> SanityTransaction:
        """Start a new transaction"""
        return SanityTransaction(self)

    def commit_transaction(self, mutations: List[Dict[str, Any]], return_docs: bool = False) -> Dict[str, Any]:
        """Commit a transaction with mutations"""
        url = f"{self.base_url}/mutate/{self.dataset}"
        params = {"returnDocuments": "true"} if return_docs else {}
        return self._make_request("POST", url, json={"mutations": mutations}, params=params)

    def create(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document"""
        return self.commit_transaction([{"create": document}])

    def create_or_replace(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Create or replace an existing document"""
        return self.commit_transaction([{"createOrReplace": document}])

    def delete(self, document_id: str) -> Dict[str, Any]:
        """Delete a document"""
        return self.commit_transaction([{"delete": {"id": document_id}}])

    def get_by_id(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID"""
        url = f"{self.cdn_url or self.base_url}/doc/{self.dataset}/{document_id}"
        try:
            return self._make_request("GET", url)
        except SanityAPIError as e:
            if e.response and e.response.status_code == 404:
                return None
            raise    def assets_upload(self, file_content: bytes, content_type: str = "image/jpeg", filename: Optional[str] = None) -> Dict[str, Any]:
        """Upload an asset (image)"""
        url = f"https://{self.project_id}.api.sanity.io/v{self.api_version}/assets/images/{self.dataset}"
        headers = self.headers.copy()
        headers["Content-Type"] = content_type

        params = {}
        if filename:
            params["filename"] = filename

        try:
            response = self.session.post(
                url,
                data=file_content,
                headers=headers,
                params=params
            )
            response.raise_for_status()
            result = response.json()
            print(f"    Raw API response: {result}")  # Debug: show actual response
            return result
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                print(f"    Error response status: {e.response.status_code}")
                print(f"    Error response body: {e.response.text}")
                raise SanityAPIError(
                    f"Asset upload failed: {str(e)}",
                    response=e.response
                )
            raise SanityAPIError(f"Asset upload failed: {str(e)}")

# --- Configuration ---
SANITY_PROJECT_ID = "sc70w3cr"
SANITY_DATASET = "production"
SANITY_API_VERSION = "2025-05-22" # Current date for latest API version
# Token will be read from environment variable SANITY_API_TOKEN

# --- Paths ---
# Script is in 'scripts', so paths are relative to the project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MERGED_LISTINGS_PATH = PROJECT_ROOT / "listings" / "merged_listings.json"

# IMAGE HANDLING (Updated 2025-05-27):
# Primary image location for manually curated and optimized images
IMAGE_STAGING_PATH = PROJECT_ROOT / "sanity_image_staging"
# Fallback location for any remaining development images
PUBLIC_IMAGES_PATH = PROJECT_ROOT / "app-next-directory" / "public"

def find_image_path(relative_path: str) -> Optional[Path]:
    """
    Enhanced image finding function (Updated 2025-05-27)

    Prioritizes optimized images, then staging, then fallback to public directory

    Search order:
    1. sanity_image_staging/optimized/ (for batch-optimized images)
    2. sanity_image_staging/images/ (for manually curated images)
    3. app-next-directory/public/ (fallback for development images)

    Args:
        relative_path: The relative path to the image from either root

    Returns:
        Path object if image is found, None otherwise
    """
    # Skip external URLs
    if relative_path.startswith(('http://', 'https://')):
        return None

    # Clean the path
    clean_path = relative_path.lstrip('/')

    # Try optimized images first (WebP format)
    base_name = Path(clean_path).stem
    optimized_webp = IMAGE_STAGING_PATH / "optimized" / f"{base_name}.webp"
    if optimized_webp.exists():
        return optimized_webp

    # Try staging images (original format)
    staging_path = IMAGE_STAGING_PATH / "images" / clean_path
    if staging_path.exists():
        return staging_path

    # Try fallback location (app-next-directory/public)
    fallback_path = PUBLIC_IMAGES_PATH / clean_path
    if fallback_path.exists():
        return fallback_path

    return None

def get_content_type(file_path: Path) -> str:
    """
    Determine the content type based on file extension
    """
    content_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }
    return content_types.get(file_path.suffix.lower(), 'image/jpeg')

def slugify_for_sanity_id(text_id):
    """
    Sanitizes a string to be a valid Sanity document ID.
    Replaces problematic characters, ensures it doesn't start/end with invalid chars.
    """
    if not text_id:
        return None
    # Replace common problematic characters with a hyphen
    s = re.sub(r'[#?/\s\.]+', '-', str(text_id).lower())
    # Remove any leading/trailing hyphens that might result
    s = s.strip('-')
    # Ensure it's not empty after stripping
    return s if s else None

def test_migration(client, num_listings=2):
    """
    Test the migration with a small subset of listings

    Args:
        client: SanityClient instance
        num_listings: Number of listings to test with (default: 2)
    """
    print(f"\n=== Testing migration with {num_listings} listings ===\n")

    if not MERGED_LISTINGS_PATH.exists():
        print(f"Error: Merged listings file not found at {MERGED_LISTINGS_PATH}")
        return False

    try:
        with open(MERGED_LISTINGS_PATH, 'r', encoding='utf-8') as f:
            listings_data = json.load(f)
        print(f"Loaded {len(listings_data)} listings from {MERGED_LISTINGS_PATH}")

        # Take only the first num_listings
        test_listings = listings_data[:num_listings]
        print(f"Selected {len(test_listings)} listings for testing")

        # Try to process each test listing
        created_count = 0
        updated_count = 0
        failed_count = 0

        for index, listing in enumerate(test_listings):
            print(f"\nProcessing test listing {index + 1}/{len(test_listings)}: {listing.get('name', 'N/A')}")

            doc_id_base = listing.get('slug') or listing.get('id') or listing.get('name')
            doc_id = slugify_for_sanity_id(doc_id_base)

            if not doc_id:
                print(f"  Skipping listing due to missing ID/slug/name: {listing.get('name', 'N/A')}")
                failed_count += 1
                continue

            # Ensure ID doesn't start with a dot, which is invalid in Sanity
            if doc_id.startswith('.'):
                doc_id = "id-" + doc_id.lstrip('.')


            sanity_doc = {
                "_id": doc_id,
                "_type": "listing",
                "name": listing.get("name"),
                "slug": {"_type": "slug", "current": listing.get("slug", doc_id)}, # Use existing slug or generated doc_id
                "descriptionShort": listing.get("description_short"),
                "descriptionLong": listing.get("description_long"),
                "address": listing.get("address_string"),
                "city": listing.get("city"),
                "country": listing.get("country"),
                "postalCode": listing.get("postal_code"),
                "category": listing.get("category"),
                "website": listing.get("website_url"),
                "phone": listing.get("phone_number"),
                "status": listing.get("status", "active").lower(), # Default to active
                "sourceUrls": [url for url in listing.get("source_urls", []) if url and isinstance(url, str) and url.startswith("http")],
                "digitalNomadFeatures": [feat for feat in listing.get("digital_nomad_features", []) if feat and isinstance(feat, str)],
                "ecoFocusTags": [tag for tag in listing.get("eco_focus_tags", []) if tag and isinstance(tag, str)],
            }

            coords = listing.get("coordinates")
            if coords and isinstance(coords, dict) and \
               coords.get("latitude") is not None and coords.get("longitude") is not None:
                try:
                    sanity_doc["location"] = {
                        "_type": "geopoint",
                        "lat": float(coords["latitude"]),
                        "lng": float(coords["longitude"])
                    }
                    if coords.get("altitude") is not None:
                         sanity_doc["location"]["alt"] = float(coords["altitude"])
                except (ValueError, TypeError) as e:
                    print(f"  Warning: Could not parse coordinates for {listing.get('name')}: {e}")


            s_rating = listing.get("sustainability_rating")
            if s_rating is not None:
                try:
                    sanity_doc["sustainabilityRating"] = float(s_rating)
                except (ValueError, TypeError):
                    print(f"  Warning: Invalid sustainability_rating for {listing.get('name')}: {s_rating}")

            # Image handling
            # TEMPORARY IMAGE HANDLING (2025-05-22):
            # This section uses a dual-location strategy until manual image curation is complete
            # TODO (2025-05-23): Simplify this to only use IMAGE_STAGING_PATH

            # Main Image
            main_image_relative_path = listing.get("primary_image_url")
            if main_image_relative_path:
                image_path = find_image_path(main_image_relative_path)
                if image_path:
                    try:
                        print(f"  Uploading main image: {image_path.name}...")
                        with open(image_path, 'rb') as img_file:
                            content_type = get_content_type(image_path)
                            image_asset = client.assets_upload(
                                img_file.read(),
                                content_type=content_type,
                                filename=image_path.name
                            )

                            if image_asset and '_id' in image_asset:
                                sanity_doc["mainImage"] = {
                                    "_type": "image",
                                    "asset": {
                                        "_type": "reference",
                                        "_ref": image_asset['_id']
                                    }
                                }
                                print(f"    Successfully uploaded main image: {image_asset['_id']}")
                            else:
                                print(f"    Error: Invalid response from image upload")

                    except SanityAPIError as e:
                        print(f"  Error uploading main image {image_path.name}: {e}")
                    except Exception as e:
                        print(f"  Unexpected error uploading main image {image_path.name}: {e}")
                else:
                    location_msg = "(checked both staging and public directories)" if not main_image_relative_path.startswith(('http://', 'https://')) else "(external URL - skipped)"
                    print(f"  Main image not found {location_msg}: {main_image_relative_path}")

            # Gallery Images
            gallery_image_relative_paths = listing.get("gallery_image_urls", [])
            if gallery_image_relative_paths and isinstance(gallery_image_relative_paths, list):
                sanity_gallery = []
                for rel_path in gallery_image_relative_paths:
                    if not rel_path:
                        continue

                    image_path = find_image_path(rel_path)
                    if image_path:
                        try:
                            print(f"  Uploading gallery image: {image_path.name}...")
                            with open(image_path, 'rb') as img_file:
                                content_type = get_content_type(image_path)
                                gallery_asset = client.assets_upload(
                                    img_file.read(),
                                    content_type=content_type,
                                    filename=image_path.name
                                )

                                if gallery_asset and '_id' in gallery_asset:
                                    sanity_gallery.append({
                                        "_type": "image",
                                        "asset": {
                                            "_type": "reference",
                                            "_ref": gallery_asset['_id']
                                        }
                                    })
                                    print(f"    Successfully uploaded gallery image: {gallery_asset['_id']}")
                                else:
                                    print(f"    Error: Invalid response from gallery image upload")

                        except SanityAPIError as e:
                            print(f"  Error uploading gallery image {image_path.name}: {e}")
                        except Exception as e:
                            print(f"  Unexpected error uploading gallery image {image_path.name}: {e}")
                    else:
                        location_msg = "(checked both staging and public directories)" if not rel_path.startswith(('http://', 'https://')) else "(external URL - skipped)"
                        print(f"  Gallery image not found {location_msg}: {rel_path}")

                if sanity_gallery:
                    sanity_doc["gallery"] = sanity_gallery

            # Clean up None values from the document before sending
            final_sanity_doc = {k: v for k, v in sanity_doc.items() if v is not None}

            try:
                # Using transactions for better error handling and atomicity
                transaction = client.transaction()

                # Check if document exists
                existing_doc = None
                try:
                    existing_doc = client.get_by_id(final_sanity_doc["_id"])
                except SanityAPIError as e:
                    if not (e.response and e.response.status_code == 404):
                        raise

                if existing_doc:
                    print(f"  Document with ID '{final_sanity_doc['_id']}' already exists. Updating.")
                    transaction.create_or_replace(final_sanity_doc)
                    result = transaction.commit(return_docs=True)
                    doc_id = result.get('results', [{}])[0].get('id')
                    print(f"    Updated document: {doc_id}")
                    updated_count += 1
                else:
                    print(f"  Creating new document with ID '{final_sanity_doc['_id']}'.")
                    transaction.create(final_sanity_doc)
                    result = transaction.commit(return_docs=True)
                    doc_id = result.get('results', [{}])[0].get('id')
                    print(f"    Created document: {doc_id}")
                    created_count += 1

            except Exception as e:
                print(f"  Error creating/updating document for {final_sanity_doc.get('name', 'N/A')} (ID: {final_sanity_doc.get('_id')}): {e}")
                failed_count += 1

        print("\n=== Test Migration Summary ===")
        print(f"Test listings processed: {len(test_listings)}")
        print(f"Successfully created: {created_count}")
        print(f"Successfully updated/replaced: {updated_count}")
        print(f"Failed: {failed_count}")

        return failed_count == 0

    except Exception as e:
        print(f"Error during test migration: {e}")
        return False

def init_sanity_client():
    """Initialize the Sanity client with credentials from environment"""
    api_token = os.environ.get("SANITY_TEST_TOKEN")
    if not api_token:
        print("Error: SANITY_TEST_TOKEN environment variable not set.")
        print("Please set it before running the script.")
        return None

    try:
        client = SanityClient(
            project_id=SANITY_PROJECT_ID,
            dataset=SANITY_DATASET,
            token=api_token,
            api_version=SANITY_API_VERSION,
            use_cdn=False
        )
        print(f"Successfully initialized Sanity client for project '{SANITY_PROJECT_ID}', dataset '{SANITY_DATASET}'.")
        return client
    except Exception as e:
        print(f"Error initializing Sanity client: {e}")
        return None

def main():
    print("Starting Sanity migration script...")

    client = init_sanity_client()
    if not client:
        return

    if not MERGED_LISTINGS_PATH.exists():
        print(f"Error: Merged listings file not found at {MERGED_LISTINGS_PATH}")
        return

    try:
        with open(MERGED_LISTINGS_PATH, 'r', encoding='utf-8') as f:
            listings_data = json.load(f)
        print(f"Loaded {len(listings_data)} listings from {MERGED_LISTINGS_PATH}")
    except Exception as e:
        print(f"Error reading or parsing {MERGED_LISTINGS_PATH}: {e}")
        return

    created_count = 0
    updated_count = 0
    failed_count = 0

    for index, listing in enumerate(listings_data):
        print(f"\nProcessing listing {index + 1}/{len(listings_data)}: {listing.get('name', 'N/A')}")

        doc_id_base = listing.get('slug') or listing.get('id') or listing.get('name')
        doc_id = slugify_for_sanity_id(doc_id_base)

        if not doc_id:
            print(f"  Skipping listing due to missing ID/slug/name: {listing.get('name', 'N/A')}")
            failed_count +=1
            continue

        # Ensure ID doesn't start with a dot, which is invalid in Sanity
        if doc_id.startswith('.'):
            doc_id = "id-" + doc_id.lstrip('.')


        sanity_doc = {
            "_id": doc_id,
            "_type": "listing",
            "name": listing.get("name"),
            "slug": {"_type": "slug", "current": listing.get("slug", doc_id)}, # Use existing slug or generated doc_id
            "descriptionShort": listing.get("description_short"),
            "descriptionLong": listing.get("description_long"),
            "address": listing.get("address_string"),
            "city": listing.get("city"),
            "country": listing.get("country"),
            "postalCode": listing.get("postal_code"),
            "category": listing.get("category"),
            "website": listing.get("website_url"),
            "phone": listing.get("phone_number"),
            "status": listing.get("status", "active").lower(), # Default to active
            "sourceUrls": [url for url in listing.get("source_urls", []) if url and isinstance(url, str) and url.startswith("http")],
            "digitalNomadFeatures": [feat for feat in listing.get("digital_nomad_features", []) if feat and isinstance(feat, str)],
            "ecoFocusTags": [tag for tag in listing.get("eco_focus_tags", []) if tag and isinstance(tag, str)],
        }

        coords = listing.get("coordinates")
        if coords and isinstance(coords, dict) and \
           coords.get("latitude") is not None and coords.get("longitude") is not None:
            try:
                sanity_doc["location"] = {
                    "_type": "geopoint",
                    "lat": float(coords["latitude"]),
                    "lng": float(coords["longitude"])
                }
                if coords.get("altitude") is not None:
                     sanity_doc["location"]["alt"] = float(coords["altitude"])
            except (ValueError, TypeError) as e:
                print(f"  Warning: Could not parse coordinates for {listing.get('name')}: {e}")


        s_rating = listing.get("sustainability_rating")
        if s_rating is not None:
            try:
                sanity_doc["sustainabilityRating"] = float(s_rating)
            except (ValueError, TypeError):
                print(f"  Warning: Invalid sustainability_rating for {listing.get('name')}: {s_rating}")

        # Image handling
        # TEMPORARY IMAGE HANDLING (2025-05-22):
        # This section uses a dual-location strategy until manual image curation is complete
        # TODO (2025-05-23): Simplify this to only use IMAGE_STAGING_PATH

        # Main Image
        main_image_relative_path = listing.get("primary_image_url")
        if main_image_relative_path:
            image_path = find_image_path(main_image_relative_path)
            if image_path:
                try:
                    print(f"  Uploading main image: {image_path.name}...")
                    with open(image_path, 'rb') as img_file:
                        content_type = get_content_type(image_path)
                        image_asset = client.assets_upload(
                            img_file.read(),
                            content_type=content_type,
                            filename=image_path.name
                        )

                        if image_asset and '_id' in image_asset:
                            sanity_doc["mainImage"] = {
                                "_type": "image",
                                "asset": {
                                    "_type": "reference",
                                    "_ref": image_asset['_id']
                                }
                            }
                            print(f"    Successfully uploaded main image: {image_asset['_id']}")
                        else:
                            print(f"    Error: Invalid response from image upload")

                except SanityAPIError as e:
                    print(f"  Error uploading main image {image_path.name}: {e}")
                except Exception as e:
                    print(f"  Unexpected error uploading main image {image_path.name}: {e}")
            else:
                location_msg = "(checked both staging and public directories)" if not main_image_relative_path.startswith(('http://', 'https://')) else "(external URL - skipped)"
                print(f"  Main image not found {location_msg}: {main_image_relative_path}")

        # Gallery Images
        gallery_image_relative_paths = listing.get("gallery_image_urls", [])
        if gallery_image_relative_paths and isinstance(gallery_image_relative_paths, list):
            sanity_gallery = []
            for rel_path in gallery_image_relative_paths:
                if not rel_path:
                    continue

                image_path = find_image_path(rel_path)
                if image_path:
                    try:
                        print(f"  Uploading gallery image: {image_path.name}...")
                        with open(image_path, 'rb') as img_file:
                            content_type = get_content_type(image_path)
                            gallery_asset = client.assets_upload(
                                img_file.read(),
                                content_type=content_type,
                                filename=image_path.name
                            )

                            if gallery_asset and '_id' in gallery_asset:
                                sanity_gallery.append({
                                    "_type": "image",
                                    "asset": {
                                        "_type": "reference",
                                        "_ref": gallery_asset['_id']
                                    }
                                })
                                print(f"    Successfully uploaded gallery image: {gallery_asset['_id']}")
                            else:
                                print(f"    Error: Invalid response from gallery image upload")

                    except SanityAPIError as e:
                        print(f"  Error uploading gallery image {image_path.name}: {e}")
                    except Exception as e:
                        print(f"  Unexpected error uploading gallery image {image_path.name}: {e}")
                else:
                    location_msg = "(checked both staging and public directories)" if not rel_path.startswith(('http://', 'https://')) else "(external URL - skipped)"
                    print(f"  Gallery image not found {location_msg}: {rel_path}")

            if sanity_gallery:
                sanity_doc["gallery"] = sanity_gallery

        # Clean up None values from the document before sending
        final_sanity_doc = {k: v for k, v in sanity_doc.items() if v is not None}

        try:
            # Using transactions for better error handling and atomicity
            transaction = client.transaction()

            # Check if document exists
            existing_doc = None
            try:
                existing_doc = client.get_by_id(final_sanity_doc["_id"])
            except SanityAPIError as e:
                if not (e.response and e.response.status_code == 404):
                    raise

            if existing_doc:
                print(f"  Document with ID '{final_sanity_doc['_id']}' already exists. Updating.")
                transaction.create_or_replace(final_sanity_doc)
                result = transaction.commit(return_docs=True)
                doc_id = result.get('results', [{}])[0].get('id')
                print(f"    Updated document: {doc_id}")
                updated_count += 1
            else:
                print(f"  Creating new document with ID '{final_sanity_doc['_id']}'.")
                transaction.create(final_sanity_doc)
                result = transaction.commit(return_docs=True)
                doc_id = result.get('results', [{}])[0].get('id')
                print(f"    Created document: {doc_id}")
                created_count += 1

        except Exception as e:
            print(f"  Error creating/updating document for {final_sanity_doc.get('name', 'N/A')} (ID: {final_sanity_doc.get('_id')}): {e}")
            failed_count += 1

    print("\n--- Migration Summary ---")
    print(f"Listings processed: {len(listings_data)}")
    print(f"Successfully created: {created_count}")
    print(f"Successfully updated/replaced: {updated_count}")
    print(f"Failed: {failed_count}")
    print("Sanity migration script finished.")

if __name__ == "__main__":
    # Before running, ensure you have the sanity-client installed:
    # pip install sanity-client
    # And that SANITY_TEST_TOKEN is set in your environment.

    client = init_sanity_client()
    if not client:
        exit(1)

    # Run test migration first
    if test_migration(client, num_listings=2):
        print("\nTest migration successful! Would you like to proceed with full migration? (y/N)")
        response = input().strip().lower()
        if response == 'y':
            main()
        else:
            print("Full migration cancelled.")
    else:
        print("\nTest migration failed. Please fix the issues before running full migration.")
