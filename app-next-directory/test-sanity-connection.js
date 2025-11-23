/**
 * Quick Test Script for Sanity HTTP Client
 * Day 1 Sprint: Testing our API client without Next.js build
 */

// Simple Node.js test script
const { createClient } = require('@sanity/client');

// Test configuration
const config = {
  projectId: 'sc70w3cr',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2025-05-24',
  token: 'skNVjIa74K4yQWW8H2y5HAeQrxNzLcfM35c6pftrxXtnqr0IiOnicSMOH4EDqZ4KqAaTm7fFLpBpvmx0tiWDCFqEBtrOH4ewZIvi7exfbQcQmZjwYYhpb0d5h7Sawh95JJkHgs8EXkXDkI8gUMNHdnidcuR5qMuYLHdiStGKJSUHRrKwz4vW'
};

async function testSanityConnection() {
  console.log('🧪 TESTING SANITY CONNECTION');
  console.log('==============================');

  try {
    const client = createClient(config);

    // Test 1: Basic query
    console.log('1. Testing basic query...');
    const listings = await client.fetch('*[_type == "listing"][0..2]');
    console.log(`✅ Found ${listings.length} listings`);

    // Test 2: Query with parameters
    console.log('2. Testing parameterized query...');
    const cities = await client.fetch(
      '*[_type == "city" && defined(name)][0..2]{ _id, name, country }'
    );
    console.log(`✅ Found ${cities.length} cities:`, cities);

    // Test 3: Authentication test (create and delete)
    console.log('3. Testing authentication...');
    const testDoc = {
      _type: 'testDocument',
      title: 'HTTP Client Test',
      timestamp: new Date().toISOString()
    };

    const created = await client.create(testDoc);
    console.log(`✅ Created test document: ${created._id}`);

    // Clean up
    await client.delete(created._id);
    console.log(`✅ Cleaned up test document`);

    console.log('\n🎉 ALL TESTS PASSED! HTTP CLIENT IS WORKING!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testSanityConnection()
  .then(() => {
    console.log('\n✅ SESSION 1 COMPLETE: HTTP API CLIENT VERIFIED!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 SESSION 1 FAILED:', error);
    process.exit(1);
  });
