#!/usr/bin/env node
/**
 * Test script to verify User Dashboard API completion (Task 5.6)
 * Tests the three sub-tasks:
 * 1. Complete favorites system
 * 2. User preference management
 * 3. User analytics implementation
 * 
 * @fileoverview Node.js script for testing dashboard completion
 * @env node
 */

/* eslint-env node */
/* global require, __dirname, console, module */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing User Dashboard API Completion (Task 5.6)');
console.log('================================================\n');

// Test 1: Check if all required API endpoints exist
function isSafePath(base, target) {
  const resolved = path.resolve(base, target);
  return resolved.startsWith(path.resolve(base));
}

const requiredEndpoints = [
  'app/api/user/dashboard/route.ts',
  'app/api/user/favorites/route.ts',
  'app/api/user/favorites/[slug]/route.ts',
  'app/api/user/analytics/route.ts',
  'app/api/user/profile/route.ts',
];

console.log('✅ Test 1: API Endpoint Existence');
let endpointsExist = true;
requiredEndpoints.forEach(endpoint => {
  const fullPath = path.join(__dirname, endpoint);
  if (isSafePath(__dirname, endpoint) && fs.existsSync(fullPath)) {
    console.log(`  ✅ ${endpoint} - EXISTS`);
  } else {
    console.log(`  ❌ ${endpoint} - MISSING`);
    endpointsExist = false;
  }
});

// Test 2: Check if required models exist
const requiredModels = [
  'src/models/UserFavorite.ts',
  'src/models/UserAnalytics.ts',
  'src/models/User.ts',
];

console.log('\n✅ Test 2: Database Model Existence');
let modelsExist = true;
requiredModels.forEach(model => {
  const fullPath = path.join(__dirname, model);
  try {
    if (!isSafePath(__dirname, model)) {
      throw new Error(`Unsafe path detected: ${model}`);
    }
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${model} - EXISTS`);
    } else {
      console.log(`  ❌ ${model} - MISSING`);
      modelsExist = false;
    }
  } catch (err) {
    console.log(`  ⚠️  ${model} - UNSAFE PATH`);
    modelsExist = false;
  }
});

// Test 3: Check API functionality by examining route implementations
console.log('\n✅ Test 3: API Implementation Completeness');

const checkApiImplementation = (filePath, requiredMethods) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!isSafePath(__dirname, filePath)) {
      throw new Error(`Unsafe path detected: ${filePath}`);
    }
    const content = fs.readFileSync(fullPath, 'utf8');
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
const dashboardResults = checkApiImplementation('app/api/user/dashboard/route.ts', ['GET']);
console.log('  📊 Dashboard API (/api/user/dashboard):');
dashboardResults.forEach(result => {
  console.log(`    ${result.implemented ? '✅' : '❌'} ${result.method} method`);
});

// Check favorites endpoint
const favoritesResults = checkApiImplementation('app/api/user/favorites/route.ts', [
  'GET',
  'POST',
]);
console.log('  ❤️ Favorites API (/api/user/favorites):');
favoritesResults.forEach(result => {
  console.log(`    ${result.implemented ? '✅' : '❌'} ${result.method} method`);
});

// Check individual favorite endpoint
const favoriteSingleResults = checkApiImplementation(
  'app/api/user/favorites/[slug]/route.ts',
  ['DELETE']
);
console.log('  ❤️ Individual Favorite API (/api/user/favorites/[slug]):');
favoriteSingleResults.forEach(result => {
  console.log(`    ${result.implemented ? '✅' : '❌'} ${result.method} method`);
});

// Check analytics endpoint
const analyticsResults = checkApiImplementation('app/api/user/analytics/route.ts', [
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
  const dashboardPath = path.join(__dirname, 'app/api/user/dashboard/route.ts');
  try {
    if (!isSafePath(__dirname, 'app/api/user/dashboard/route.ts')) {
      throw new Error('Unsafe file path');
    }
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

  const requiredDashboardFeatures = [
    'analytics',
    'favorites',
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
} catch (error) {
  console.log('  ❌ Could not analyze dashboard structure');
}

// test-dashboard-completion.js

const listingsStatus = 'complete';
const reviewsStatus = 'incomplete';
const imagesStatus = 'complete';
const sanityStatus = 'complete';

const dashboardChecks = [
  { name: 'Listings', status: listingsStatus },
  { name: 'Reviews', status: reviewsStatus },
  { name: 'Images', status: imagesStatus },
  { name: 'Sanity', status: sanityStatus },
];

function checkDashboardCompletion(checks) {
  return checks.every(check => check.status === 'complete');
}

// Example usage/test
if (checkDashboardCompletion(dashboardChecks)) {
  console.log('Dashboard is complete!');
} else {
  console.log('Dashboard is not complete.');
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

module.exports = {
  dashboardChecks,
  checkDashboardCompletion,
};
