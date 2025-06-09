"""
Quick Migration Test
Sustainable Digital Nomads Directory - Pipeline Validation

This script performs a quick test of the migration pipeline setup
to ensure everything is ready for the full migration tomorrow.
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from scripts.migration_config import get_config, validate_configuration, get_environment_variables
from scripts.test_sanity_auth import SanityAuthTester
import os

async def test_pipeline_setup():
    """Test the complete pipeline setup"""
    print("🧪 Quick Migration Pipeline Test")
    print("=" * 50)

    test_results = {
        "config_validation": False,
        "environment_check": False,
        "csv_validation": False,
        "sanity_auth": False,
        "overall_status": "FAILED"
    }

    # 1. Test configuration
    print("\n1️⃣ Testing Configuration...")
    config = get_config()
    validation = validate_configuration()

    if validation["valid"]:
        print("   ✅ Configuration is valid")
        test_results["config_validation"] = True
    else:
        print("   ❌ Configuration has issues:")
        for issue in validation["issues"]:
            print(f"      - {issue}")

    if validation["warnings"]:
        print("   ⚠️ Warnings:")
        for warning in validation["warnings"]:
            print(f"      - {warning}")

    # 2. Test environment variables
    print("\n2️⃣ Testing Environment Variables...")
    env_vars = get_environment_variables()
    missing_vars = []

    for var in env_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if not missing_vars:
        print("   ✅ All environment variables are set")
        test_results["environment_check"] = True
    else:
        print("   ❌ Missing environment variables:")
        for var in missing_vars:
            print(f"      - {var}")

    # 3. Test CSV file
    print("\n3️⃣ Testing CSV File...")
    csv_file = config["csv_file"]

    if csv_file.exists():
        print(f"   ✅ CSV file found: {csv_file}")

        # Quick CSV validation
        try:
            import csv
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                rows = list(reader)

                required_fields = ['id', 'name', 'primary_image_url', 'gallery_image_urls', 'source_urls']
                if rows and all(field in rows[0] for field in required_fields):
                    print(f"   ✅ CSV structure is valid ({len(rows)} rows)")
                    test_results["csv_validation"] = True
                else:
                    print("   ❌ CSV missing required fields")

        except Exception as e:
            print(f"   ❌ CSV validation failed: {e}")
    else:
        print(f"   ❌ CSV file not found: {csv_file}")

    # 4. Test Sanity authentication (if env vars are available)
    print("\n4️⃣ Testing Sanity Authentication...")

    if test_results["environment_check"]:
        try:
            auth_tester = SanityAuthTester()
            auth_results = await auth_tester.run_comprehensive_tests()

            if auth_results.get("overall_status") == "PASSED":
                print("   ✅ Sanity authentication successful")
                test_results["sanity_auth"] = True
            else:
                print("   ❌ Sanity authentication failed")
                print(f"      Check logs for details")

        except Exception as e:
            print(f"   ❌ Sanity auth test failed: {e}")
    else:
        print("   ⏭️ Skipping (missing environment variables)")

    # 5. Overall status
    print("\n" + "=" * 50)

    all_tests_passed = all([
        test_results["config_validation"],
        test_results["environment_check"],
        test_results["csv_validation"],
        test_results["sanity_auth"]
    ])

    if all_tests_passed:
        test_results["overall_status"] = "PASSED"
        print("🎉 ALL TESTS PASSED - Ready for migration!")
    else:
        print("❌ Some tests failed - Fix issues before migration")

    print("\n📋 Test Summary:")
    for test_name, result in test_results.items():
        if test_name != "overall_status":
            status = "✅" if result else "❌"
            print(f"   {status} {test_name.replace('_', ' ').title()}")

    print(f"\n🎯 Overall Status: {test_results['overall_status']}")

    return test_results

async def main():
    """Main entry point"""
    try:
        results = await test_pipeline_setup()

        if results["overall_status"] == "PASSED":
            print("\n🚀 You're ready to run the full migration tomorrow!")
            print("   Run: python scripts/complete_migration_pipeline.py")
        else:
            print("\n🔧 Please fix the issues above before running the migration.")

    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        return False

    return True

if __name__ == "__main__":
    asyncio.run(main())
