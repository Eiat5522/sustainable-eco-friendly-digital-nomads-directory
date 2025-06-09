#!/usr/bin/env node

/**
 * Development Server Integration Test
 * Tests that the authentication system works with the development server
 */

const { spawn } = require('child_process');
const http = require('http');

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(url, expectedStatus = 200, description = '') {
  return new Promise((resolve) => {
    const request = http.get(url, (res) => {
      const success = res.statusCode === expectedStatus;
      const status = success ? '✅' : '❌';
      const color = success ? 'green' : 'red';
      log(`${status} ${description}: HTTP ${res.statusCode}`, color);
      resolve(success);
    });

    request.on('error', (error) => {
      log(`❌ ${description}: ${error.message}`, 'red');
      resolve(false);
    });

    request.setTimeout(5000, () => {
      log(`❌ ${description}: Request timeout`, 'red');
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const success = await testEndpoint(url, 200, 'Server health check');
      if (success) return true;
    } catch (error) {
      // Ignore errors during startup
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function runServerIntegrationTest() {
  log('🚀 Development Server Integration Test', 'blue');
  log('=' .repeat(50), 'blue');

  log('\n🔧 Starting development server...', 'blue');

  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  });

  let serverOutput = '';
  serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });

  serverProcess.stderr.on('data', (data) => {
    serverOutput += data.toString();
  });

  // Wait for server to start
  log('⏳ Waiting for server to start...', 'yellow');
  const serverReady = await waitForServer('http://localhost:3000');

  if (!serverReady) {
    log('❌ Server failed to start within 30 seconds', 'red');
    serverProcess.kill();
    return false;
  }

  log('✅ Development server is running!', 'green');

  // Test authentication endpoints
  log('\n🔍 Testing Authentication Endpoints:', 'blue');

  const endpoints = [
    { url: 'http://localhost:3000/', desc: 'Homepage' },
    { url: 'http://localhost:3000/api/auth/providers', desc: 'Auth providers' },
    { url: 'http://localhost:3000/api/auth/session', desc: 'Session endpoint' },
    { url: 'http://localhost:3000/login', desc: 'Login page' },
    { url: 'http://localhost:3000/register', desc: 'Registration page' }
  ];

  let allEndpointsWorking = true;
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint.url, 200, endpoint.desc);
    allEndpointsWorking = allEndpointsWorking && success;
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  // Test protected routes (should redirect to login)
  log('\n🔒 Testing Protected Routes:', 'blue');
  const protectedEndpoints = [
    { url: 'http://localhost:3000/dashboard', desc: 'Dashboard (protected)', expectedStatus: 302 },
    { url: 'http://localhost:3000/admin', desc: 'Admin panel (protected)', expectedStatus: 302 }
  ];

  for (const endpoint of protectedEndpoints) {
    const success = await testEndpoint(endpoint.url, endpoint.expectedStatus, endpoint.desc);
    allEndpointsWorking = allEndpointsWorking && success;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Cleanup
  log('\n🧹 Cleaning up...', 'blue');
  serverProcess.kill();

  // Wait for graceful shutdown
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Summary
  log('\n📊 Server Integration Test Results:', 'blue');
  log('=' .repeat(50), 'blue');

  if (allEndpointsWorking) {
    log('🎉 All endpoints are working correctly!', 'green');
    log('✅ Authentication system is properly integrated', 'green');
    log('\n🎯 Ready for manual testing:', 'blue');
    log('  1. npm run dev', 'blue');
    log('  2. Visit http://localhost:3000', 'blue');
    log('  3. Test registration: /register', 'blue');
    log('  4. Test login: /login', 'blue');
    log('  5. Test protected routes after login', 'blue');
  } else {
    log('❌ Some endpoints failed', 'red');
    log('🔍 Check server logs for details', 'yellow');
  }

  return allEndpointsWorking;
}

// Run the test
runServerIntegrationTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`💥 Server integration test crashed: ${error.message}`, 'red');
    process.exit(1);
  });
