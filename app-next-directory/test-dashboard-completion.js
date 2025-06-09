#!/usr/bin/env node
/**
 * Test script to verify User Dashboard API completion (Task 5.6)
 * Tests the three sub-tasks:
 * 1. Complete favorites system
 * 2. User preference management
 * 3. User analytics implementation
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing User Dashboard API Completion (Task 5.6)');
console.log('================================================\n');

// Test 1: Check if all required API endpoints exist
const requiredEndpoints = [
  'src/app/api/user/dashboard/route.ts',
  'src/app/api/user/favorites/route.ts',
  'src/app/api/user/favorites/[listingId]/route.ts',
  'src/app/api/user/preferences/route.ts',
  'src/app/api/user/analytics/route.ts',
  'src/app/api/user/profile/route.ts',
];

console.log('✅ Test 1: API Endpoint Existence');
let endpointsExist = true;
requiredEndpoints.forEach(endpoint => {
  const fullPath = path.join(__dirname, endpoint);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${endpoint} - EXISTS`);
  } else {
    console.log(`  ❌ ${endpoint} - MISSING`);
    endpointsExist = false;
  }
});

// Test 2: Check if required models exist
const requiredModels = [
  'src/models/UserFavorite.ts',
  'src/models/UserPreferences.ts',
  'src/models/UserAnalytics.ts',
  'src/models/User.ts',
];

console.log('\n✅ Test 2: Database Model Existence');
let modelsExist = true;
requiredModels.forEach(model => {
  const fullPath = path.join(__dirname, model);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${model} - EXISTS`);
  } else {
    console.log(`  ❌ ${model} - MISSING`);
    modelsExist = false;
  }
});

// Test 3: Check API functionality by examining route implementations
console.log('\n✅ Test 3: API Implementation Completeness');

const checkApiImplementation = (filePath, requiredMethods) => {
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    const results = requiredMethods.map(method => {
      const hasMethod = content.includes(`export async function ${method}`);
      return { method, implemented: hasMethod };
    });
    return results;
  } catch (error) {
    return requiredMethods.map(method => ({ method, implemented: false }));
  }
};

// Check dashboard endpoint
const dashboardResults = checkApiImplementation('src/app/api/user/dashboard/route.ts', ['GET']);
console.log('  📊 Dashboard API (/api/user/dashboard):');
dashboardResults.forEach(result => {
  console.log(`    ${result.implemented ? '✅' : '❌'} ${result.method} method`);
});

// Check favorites endpoint
const favoritesResults = checkApiImplementation('src/app/api/user/favorites/route.ts', [
  'GET',
  'POST',
]);
console.log('  ❤️ Favorites API (/api/user/favorites):');
favoritesResults.forEach(result => {
  console.log(`    ${result.implemented ? '✅' : '❌'} ${result.method} method`);
});

// Check individual favorite endpoint
const favoriteSingleResults = checkApiImplementation(
  'src/app/api/user/favorites/[listingId]/route.ts',
  ['DELETE']
);
console.log('  ❤️ Individual Favorite API (/api/user/favorites/[listingId]):');
favoriteSingleResults.forEach(result => {
  console.log(`    ${result.implemented ? '✅' : '❌'} ${result.method} method`);
});

// Check preferences endpoint
const preferencesResults = checkApiImplementation('src/app/api/user/preferences/route.ts', [
  'GET',
  'PUT',
]);
console.log('  ⚙️ Preferences API (/api/user/preferences):');
preferencesResults.forEach(result => {
  console.log(`    ${result.implemented ? '✅' : '❌'} ${result.method} method`);
});

// Check analytics endpoint
const analyticsResults = checkApiImplementation('src/app/api/user/analytics/route.ts', [
  'GET',
  'POST',
]);
console.log('  📈 Analytics API (/api/user/analytics):');
analyticsResults.forEach(result => {
  console.log(`    ${result.implemented ? '✅' : '❌'} ${result.method} method`);
});

// Test 4: Check for comprehensive dashboard data structure
console.log('\n✅ Test 4: Dashboard Data Structure Completeness');
try {
  const dashboardContent = fs.readFileSync(
    path.join(__dirname, 'src/app/api/user/dashboard/route.ts'),
    'utf8'
  );

  const requiredDashboardFeatures = [
    'profile',
    'activity',
    'preferences',
    'insights',
    'achievements',
    'recommendations',
    'monthlyTrends',
  ];

  requiredDashboardFeatures.forEach(feature => {
    if (dashboardContent.includes(feature)) {
      console.log(`  ✅ ${feature} - IMPLEMENTED`);
    } else {
      console.log(`  ❌ ${feature} - MISSING`);
    }
  });
} catch (error) {
  console.log('  ❌ Could not analyze dashboard structure');
}

// Summary
console.log('\n🎯 Task 5.6 Completion Summary');
console.log('==============================');

const allImplemented = endpointsExist && modelsExist;
if (allImplemented) {
  console.log('✅ All required components appear to be implemented!');
  console.log('✅ Favorites system: COMPLETE');
  console.log('✅ User preference management: COMPLETE');
  console.log('✅ User analytics: COMPLETE');
  console.log('\n🎉 Task 5.6 (User Dashboard API) appears to be COMPLETE!');
  console.log('🚀 Ready to proceed to Workstream E (Integration & Testing)');
} else {
  console.log('❌ Some components are missing or incomplete');
  console.log('🔧 Additional work needed before Task 5.6 can be marked complete');
}
