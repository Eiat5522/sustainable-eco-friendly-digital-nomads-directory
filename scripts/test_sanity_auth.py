"""
Enhanced Sanity API Authentication and Connection Testing
Sustainable Digital Nomads Directory - Backend Integration

This script provides comprehensive testing for Sanity API authentication,
connection validation, and environment configuration verification.
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

# Load environment variables
load_dotenv()
load_dotenv(PROJECT_ROOT / 'sanity-backup' / '.env.development')

class SanityAuthTester:
    """
    Comprehensive authentication and API testing for Sanity CMS
    """

    def __init__(self):
        self.project_id = os.getenv("SANITY_STUDIO_PROJECT_ID", "sc70w3cr")
        self.dataset = os.getenv("SANITY_STUDIO_DATASET", "development")
        self.api_version = os.getenv("SANITY_STUDIO_API_VERSION", "2025-05-24")
        self.test_token = os.getenv("SANITY_TEST_TOKEN")
        self.admin_token = os.getenv("SANITY_TOKEN")

        self.base_url = f"https://{self.project_id}.api.sanity.io/v{self.api_version}"
        self.cdn_url = f"https://{self.project_id}.apicdn.sanity.io/v{self.api_version}"

        self.test_results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "environment_check": {},
            "connection_tests": {},
            "authentication_tests": {},
            "api_functionality_tests": {},
            "performance_tests": {},
            "overall_status": "PENDING"
        }

    def print_header(self, title: str, char: str = "="):
        """Print a formatted header"""
        print(f"\n{char * 60}")
        print(f" {title}")
        print(f"{char * 60}")

    def print_result(self, test_name: str, status: str, details: str = ""):
        """Print formatted test result"""
        status_emoji = {
            "PASS": "✅",
            "FAIL": "❌",
            "WARN": "⚠️",
            "INFO": "ℹ️"
        }
        print(f"{status_emoji.get(status, '🔵')} {test_name}: {status}")
        if details:
            print(f"   {details}")

    def test_environment_variables(self) -> Dict[str, Any]:
        """Test all required environment variables are present"""
        self.print_header("Environment Variables Check")

        required_vars = {
            "SANITY_STUDIO_PROJECT_ID": self.project_id,
            "SANITY_STUDIO_DATASET": self.dataset,
            "SANITY_STUDIO_API_VERSION": self.api_version
        }

        optional_vars = {
            "SANITY_TEST_TOKEN": self.test_token,
            "SANITY_TOKEN": self.admin_token
        }

        results = {"required": {}, "optional": {}, "status": "PASS"}

        # Check required variables
        for var_name, value in required_vars.items():
            if value:
                self.print_result(var_name, "PASS", f"Value: {value}")
                results["required"][var_name] = {"status": "PASS", "value": value}
            else:
                self.print_result(var_name, "FAIL", "Missing or empty")
                results["required"][var_name] = {"status": "FAIL", "value": None}
                results["status"] = "FAIL"

        # Check optional variables
        for var_name, value in optional_vars.items():
            if value:
                masked_value = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
                self.print_result(var_name, "PASS", f"Value: {masked_value}")
                results["optional"][var_name] = {"status": "PASS", "masked_value": masked_value}
            else:
                self.print_result(var_name, "WARN", "Not set (may be required for write operations)")
                results["optional"][var_name] = {"status": "WARN", "value": None}

        return results

    def test_basic_connection(self) -> Dict[str, Any]:
        """Test basic HTTP connectivity to Sanity API"""
        self.print_header("Basic Connection Tests")

        results = {"api_reachable": False, "cdn_reachable": False, "status": "FAIL"}

        # Test API endpoint
        try:
            response = requests.get(f"{self.base_url}/data/query/{self.dataset}?query=*",
                                  timeout=10)
            if response.status_code in [200, 401, 403]:  # 401/403 means API is reachable
                self.print_result("API Endpoint", "PASS", f"Status: {response.status_code}")
                results["api_reachable"] = True
            else:
                self.print_result("API Endpoint", "FAIL", f"Unexpected status: {response.status_code}")
        except requests.RequestException as e:
            self.print_result("API Endpoint", "FAIL", f"Connection error: {str(e)}")

        # Test CDN endpoint
        try:
            response = requests.get(f"{self.cdn_url}/data/query/{self.dataset}?query=*",
                                  timeout=10)
            if response.status_code in [200, 401, 403]:
                self.print_result("CDN Endpoint", "PASS", f"Status: {response.status_code}")
                results["cdn_reachable"] = True
            else:
                self.print_result("CDN Endpoint", "FAIL", f"Unexpected status: {response.status_code}")
        except requests.RequestException as e:
            self.print_result("CDN Endpoint", "FAIL", f"Connection error: {str(e)}")

        if results["api_reachable"] or results["cdn_reachable"]:
            results["status"] = "PASS"

        return results

    def test_authentication(self) -> Dict[str, Any]:
        """Test authentication with available tokens"""
        self.print_header("Authentication Tests")

        results = {"test_token": {}, "admin_token": {}, "status": "FAIL"}

        # Test with test token
        if self.test_token:
            auth_result = self._test_token_auth(self.test_token, "Test Token")
            results["test_token"] = auth_result
        else:
            self.print_result("Test Token", "WARN", "Token not provided")
            results["test_token"] = {"status": "WARN", "message": "Token not provided"}

        # Test with admin token
        if self.admin_token:
            auth_result = self._test_token_auth(self.admin_token, "Admin Token")
            results["admin_token"] = auth_result
        else:
            self.print_result("Admin Token", "WARN", "Token not provided")
            results["admin_token"] = {"status": "WARN", "message": "Token not provided"}

        # Overall authentication status
        if (results["test_token"].get("status") == "PASS" or
            results["admin_token"].get("status") == "PASS"):
            results["status"] = "PASS"

        return results

    def _test_token_auth(self, token: str, token_name: str) -> Dict[str, Any]:
        """Test authentication with a specific token"""
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        try:
            # Test read access
            response = requests.get(
                f"{self.base_url}/data/query/{self.dataset}?query=*[0...1]",
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                doc_count = len(data.get("result", []))
                self.print_result(f"{token_name} (Read)", "PASS",
                                f"Retrieved {doc_count} documents")

                # Test write access with a safe operation
                test_doc = {
                    "_type": "test",
                    "_id": f"test-auth-{int(time.time())}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "purpose": "authentication_test"
                }

                write_response = requests.post(
                    f"{self.base_url}/data/mutate/{self.dataset}",
                    headers=headers,
                    json={"mutations": [{"create": test_doc}]},
                    timeout=10
                )

                if write_response.status_code == 200:
                    self.print_result(f"{token_name} (Write)", "PASS",
                                    "Can create documents")

                    # Clean up test document
                    requests.post(
                        f"{self.base_url}/data/mutate/{self.dataset}",
                        headers=headers,
                        json={"mutations": [{"delete": {"id": test_doc["_id"]}}]},
                        timeout=10
                    )

                    return {
                        "status": "PASS",
                        "read_access": True,
                        "write_access": True,
                        "permissions": "full"
                    }
                else:
                    self.print_result(f"{token_name} (Write)", "WARN",
                                    f"Write failed: {write_response.status_code}")
                    return {
                        "status": "PASS",
                        "read_access": True,
                        "write_access": False,
                        "permissions": "read_only"
                    }

            elif response.status_code == 401:
                self.print_result(f"{token_name}", "FAIL", "Invalid token")
                return {"status": "FAIL", "message": "Invalid token"}

            elif response.status_code == 403:
                self.print_result(f"{token_name}", "FAIL", "Access forbidden")
                return {"status": "FAIL", "message": "Access forbidden"}

            else:
                self.print_result(f"{token_name}", "FAIL",
                                f"Unexpected status: {response.status_code}")
                return {"status": "FAIL", "message": f"HTTP {response.status_code}"}

        except requests.RequestException as e:
            self.print_result(f"{token_name}", "FAIL", f"Request error: {str(e)}")
            return {"status": "FAIL", "message": str(e)}

    def test_api_functionality(self) -> Dict[str, Any]:
        """Test core API functionality required for migration"""
        self.print_header("API Functionality Tests")

        results = {"queries": {}, "mutations": {}, "assets": {}, "status": "FAIL"}

        # Use the best available token
        token = self.test_token or self.admin_token
        if not token:
            self.print_result("API Functionality", "FAIL", "No authentication token available")
            return results

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Test GROQ queries
        try:
            query_response = requests.get(
                f"{self.base_url}/data/query/{self.dataset}?query=*[_type == 'listing'][0...3]",
                headers=headers,
                timeout=15
            )

            if query_response.status_code == 200:
                data = query_response.json()
                listing_count = len(data.get("result", []))
                self.print_result("GROQ Queries", "PASS",
                                f"Found {listing_count} existing listings")
                results["queries"] = {"status": "PASS", "listing_count": listing_count}
            else:
                self.print_result("GROQ Queries", "FAIL",
                                f"Query failed: {query_response.status_code}")
                results["queries"] = {"status": "FAIL"}

        except requests.RequestException as e:
            self.print_result("GROQ Queries", "FAIL", f"Query error: {str(e)}")
            results["queries"] = {"status": "FAIL", "error": str(e)}

        # Test mutations (transactions)
        test_doc_id = f"test-functionality-{int(time.time())}"
        try:
            mutation_response = requests.post(
                f"{self.base_url}/data/mutate/{self.dataset}",
                headers=headers,
                json={
                    "mutations": [{
                        "create": {
                            "_type": "test",
                            "_id": test_doc_id,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "purpose": "functionality_test"
                        }
                    }]
                },
                timeout=15
            )

            if mutation_response.status_code == 200:
                self.print_result("Mutations", "PASS", "Document creation successful")
                results["mutations"] = {"status": "PASS", "create": True}

                # Test deletion
                delete_response = requests.post(
                    f"{self.base_url}/data/mutate/{self.dataset}",
                    headers=headers,
                    json={"mutations": [{"delete": {"id": test_doc_id}}]},
                    timeout=15
                )

                if delete_response.status_code == 200:
                    self.print_result("Document Cleanup", "PASS", "Test document deleted")
                    results["mutations"]["delete"] = True

            else:
                self.print_result("Mutations", "FAIL",
                                f"Mutation failed: {mutation_response.status_code}")
                results["mutations"] = {"status": "FAIL"}

        except requests.RequestException as e:
            self.print_result("Mutations", "FAIL", f"Mutation error: {str(e)}")
            results["mutations"] = {"status": "FAIL", "error": str(e)}

        # Test asset upload capability
        try:
            # Create a minimal test image (1x1 PNG)
            test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'

            asset_headers = headers.copy()
            asset_headers["Content-Type"] = "image/png"

            asset_response = requests.post(
                f"https://{self.project_id}.api.sanity.io/v{self.api_version}/assets/images/{self.dataset}",
                headers=asset_headers,
                data=test_image_data,
                params={"filename": "test-auth.png"},
                timeout=20
            )

            if asset_response.status_code == 200:
                asset_data = asset_response.json()
                asset_id = asset_data.get("_id", "unknown")
                self.print_result("Asset Upload", "PASS", f"Uploaded test image: {asset_id}")
                results["assets"] = {"status": "PASS", "test_asset_id": asset_id}
            else:
                self.print_result("Asset Upload", "FAIL",
                                f"Upload failed: {asset_response.status_code}")
                results["assets"] = {"status": "FAIL"}

        except requests.RequestException as e:
            self.print_result("Asset Upload", "FAIL", f"Upload error: {str(e)}")
            results["assets"] = {"status": "FAIL", "error": str(e)}

        # Overall functionality status
        if (results["queries"].get("status") == "PASS" and
            results["mutations"].get("status") == "PASS"):
            results["status"] = "PASS"

        return results

    def test_performance(self) -> Dict[str, Any]:
        """Test API performance and response times"""
        self.print_header("Performance Tests")

        results = {"response_times": {}, "status": "PASS"}

        token = self.test_token or self.admin_token
        if not token:
            self.print_result("Performance Tests", "WARN", "No token available for testing")
            return {"status": "WARN", "message": "No authentication token"}

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Test query response time
        try:
            start_time = time.time()
            response = requests.get(
                f"{self.base_url}/data/query/{self.dataset}?query=*[0...10]",
                headers=headers,
                timeout=30
            )
            query_time = time.time() - start_time

            if response.status_code == 200:
                if query_time < 2.0:
                    self.print_result("Query Performance", "PASS", f"{query_time:.2f}s (excellent)")
                elif query_time < 5.0:
                    self.print_result("Query Performance", "PASS", f"{query_time:.2f}s (good)")
                else:
                    self.print_result("Query Performance", "WARN", f"{query_time:.2f}s (slow)")

                results["response_times"]["query"] = query_time
            else:
                self.print_result("Query Performance", "FAIL", f"HTTP {response.status_code}")

        except requests.RequestException as e:
            self.print_result("Query Performance", "FAIL", f"Error: {str(e)}")

        return results

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all authentication and API tests"""
        self.print_header("🚀 SANITY API AUTHENTICATION & TESTING SUITE", "=")
        print(f"Project: {self.project_id}")
        print(f"Dataset: {self.dataset}")
        print(f"API Version: {self.api_version}")
        print(f"Timestamp: {self.test_results['timestamp']}")

        # Run all test suites
        self.test_results["environment_check"] = self.test_environment_variables()
        self.test_results["connection_tests"] = self.test_basic_connection()
        self.test_results["authentication_tests"] = self.test_authentication()
        self.test_results["api_functionality_tests"] = self.test_api_functionality()
        self.test_results["performance_tests"] = self.test_performance()

        # Determine overall status
        critical_tests = [
            self.test_results["environment_check"]["status"],
            self.test_results["connection_tests"]["status"],
            self.test_results["authentication_tests"]["status"],
            self.test_results["api_functionality_tests"]["status"]
        ]

        if all(status == "PASS" for status in critical_tests):
            self.test_results["overall_status"] = "PASS"
            overall_emoji = "✅"
            overall_message = "All critical tests passed! Ready for migration."
        elif any(status == "FAIL" for status in critical_tests):
            self.test_results["overall_status"] = "FAIL"
            overall_emoji = "❌"
            overall_message = "Critical tests failed. Please fix issues before migration."
        else:
            self.test_results["overall_status"] = "WARN"
            overall_emoji = "⚠️"
            overall_message = "Some issues detected. Migration may proceed with caution."

        # Print summary
        self.print_header("🎯 OVERALL TEST RESULTS", "=")
        print(f"{overall_emoji} Status: {self.test_results['overall_status']}")
        print(f"   {overall_message}")

        return self.test_results

    def save_results(self, filepath: Optional[Path] = None):
        """Save test results to JSON file"""
        if filepath is None:
            filepath = PROJECT_ROOT / "logs" / f"sanity_auth_test_{int(time.time())}.json"

        filepath.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.test_results, f, indent=2, default=str)

        print(f"\n📄 Test results saved to: {filepath}")

def main():
    """Main execution function"""
    tester = SanityAuthTester()
    results = tester.run_all_tests()
    tester.save_results()

    # Exit with appropriate code
    if results["overall_status"] == "PASS":
        sys.exit(0)
    elif results["overall_status"] == "WARN":
        sys.exit(1)
    else:
        sys.exit(2)

if __name__ == "__main__":
    main()
