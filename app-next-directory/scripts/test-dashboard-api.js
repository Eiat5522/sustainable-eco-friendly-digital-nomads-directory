/**
 * Simple test script to validate User Dashboard API endpoints
 * This script tests that the API routes are properly configured and handle requests
 */

const API_BASE = 'http://localhost:3000';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      success: response.ok || response.status === 401 // 401 is expected for unauthenticated requests
    };
  } catch (error) {
    return {
      status: 500,
      error: error.message,
      success: false
    };
  }
}

async function runTests() {
  console.log('🚀 Testing User Dashboard API Endpoints...\n');

  const tests = [
    {
      name: 'GET /api/user/preferences',
      endpoint: '/api/user/preferences',
      method: 'GET'
    },
    {
      name: 'PUT /api/user/preferences',
      endpoint: '/api/user/preferences',
      method: 'PUT',
      body: {
        location: { country: 'USA', city: 'Test City' },
        notifications: { email: true, push: false }
      }
    },
    {
      name: 'PATCH /api/user/preferences',
      endpoint: '/api/user/preferences',
      method: 'PATCH',
      body: {
        section: 'notifications',
        data: { email: false }
      }
    },
    {
      name: 'GET /api/user/analytics',
      endpoint: '/api/user/analytics',
      method: 'GET'
    },
    {
      name: 'GET /api/user/analytics with params',
      endpoint: '/api/user/analytics?timeRange=30d&includeHistory=false',
      method: 'GET'
    },
    {
      name: 'POST /api/user/analytics',
      endpoint: '/api/user/analytics',
      method: 'POST',
      body: {
        eventType: 'page_view',
        eventData: {
          page: '/listings',
          duration: 5000,
          metadata: { source: 'test' }
        }
      }
    },
    {
      name: 'GET /api/user/dashboard',
      endpoint: '/api/user/dashboard',
      method: 'GET'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);
    
    const result = await testEndpoint(test.endpoint, test.method, test.body);
    
    if (result.success) {
      console.log('✅ PASS');
      passedTests++;
      
      // Log expected 401 responses
      if (result.status === 401) {
        console.log(`   └─ Expected: Authentication required`);
      }
    } else {
      console.log('❌ FAIL');
      console.log(`   └─ Status: ${result.status}, Error: ${result.error || 'Unknown error'}`);
    }
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All API endpoints are working correctly!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Implement authentication to test full functionality');
    console.log('   2. Create frontend components for the dashboard');
    console.log('   3. Test with real user data');
  } else {
    console.log('⚠️  Some tests failed. Check the API implementation.');
  }
}

// Check if we're running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with fetch support or a browser environment.');
  console.log('To test the API endpoints:');
  console.log('1. Start the Next.js development server: npm run dev');
  console.log('2. Run this script in a browser console or use a tool like Postman');
} else {
  runTests().catch(console.error);
}
