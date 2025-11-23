// route-test.js
// Simple script to verify dynamic routes are working correctly

const TEST_ROUTES = [
  // Test static routes
  '/',
  '/listings',
  '/search',

  // Test city routes
  '/city/bangkok',
  '/city/chiang-mai',

  // Test listing routes
  '/listings/sample-eco-friendly-listing',
  '/listings/green-coworking-space',

  // Test category routes
  '/category/coworking',
  '/category/accommodation',
];

async function testRoutes() {
  console.log('Testing dynamic routes...');

  for (const route of TEST_ROUTES) {
    try {
      const response = await fetch(`http://localhost:3000${route}`);
      console.log(`Route: ${route} - Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
      console.error(`Route: ${route} - Error: ${error.message}`);
    }
  }
}

testRoutes();
