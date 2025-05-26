#!/usr/bin/env node

/**
 * Phase 1 Integration Test Suite
 * Comprehensive testing for authentication system integration
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(command, args = [], description = '') {
  return new Promise((resolve, reject) => {
    if (description) {
      log(`🔧 ${description}`, 'blue');
    }

    const process = spawn(command, args, {
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${description || command} - Success`, 'green');
        resolve({ success: true, stdout, stderr });
      } else {
        log(`❌ ${description || command} - Failed (exit code: ${code})`, 'red');
        if (stderr) log(stderr, 'red');
        resolve({ success: false, stdout, stderr, code });
      }
    });

    process.on('error', (error) => {
      log(`❌ ${description || command} - Error: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  log(`${status} ${description}: ${exists ? 'Found' : 'Missing'}`, exists ? 'green' : 'red');
  return exists;
}

async function runIntegrationTests() {
  log('🚀 Phase 1: Environment & Integration Test Suite', 'cyan');
  log('=' .repeat(60), 'cyan');

  // Step 1: Environment Validation
  log('\n📋 Step 1: Environment Validation', 'magenta');
  const envResult = await runCommand('node', ['scripts/validate-env.js'], 'Validating environment variables');

  if (!envResult.success) {
    log('❌ Environment validation failed. Please check your .env.local file.', 'red');
    log('📖 See QUICK_MONGODB_SETUP.md for MongoDB configuration.', 'yellow');
    return false;
  }

  // Step 2: Database Connection Test
  log('\n🗄️ Step 2: Database Connection Test', 'magenta');
  const dbResult = await runCommand('node', ['scripts/test-db-connection.js'], 'Testing MongoDB connection');

  if (!dbResult.success) {
    log('❌ Database connection failed. Please configure MongoDB.', 'red');
    log('📖 See QUICK_MONGODB_SETUP.md for setup instructions.', 'yellow');
    return false;
  }

  // Step 3: File Structure Check
  log('\n📁 Step 3: Authentication Files Check', 'magenta');
  const authFiles = [
    { path: 'src/models/User.ts', desc: 'User model' },
    { path: 'src/lib/dbConnect.ts', desc: 'Database connection' },
    { path: 'src/types/auth.ts', desc: 'Authentication types' },
    { path: 'src/app/api/auth/[...nextauth]/route.ts', desc: 'NextAuth configuration' },
    { path: 'src/app/api/auth/register/route.ts', desc: 'Registration API' },
    { path: 'src/middleware.ts', desc: 'Route protection middleware' },
    { path: 'src/app/register/page.tsx', desc: 'Registration UI' },
    { path: 'src/app/login/page.tsx', desc: 'Login UI' }
  ];

  let allFilesExist = true;
  for (const file of authFiles) {
    const exists = await checkFileExists(file.path, file.desc);
    allFilesExist = allFilesExist && exists;
  }

  if (!allFilesExist) {
    log('❌ Some authentication files are missing.', 'red');
    return false;
  }

  // Step 4: Test Dependencies
  log('\n📦 Step 4: Dependencies Check', 'magenta');
  const depResult = await runCommand('npm', ['ls', '--depth=0'], 'Checking installed dependencies');

  // Step 5: Lint Check
  log('\n🔍 Step 5: Code Quality Check', 'magenta');
  const lintResult = await runCommand('npm', ['run', 'lint'], 'Running ESLint');

  // Step 6: Authentication Test Suite
  log('\n🧪 Step 6: Authentication Test Suite', 'magenta');
  log('Running comprehensive Playwright tests...', 'blue');

  const testSuites = [
    { command: 'npm run test:auth', desc: 'Authentication flow tests' },
    { command: 'npm run test:rbac', desc: 'Role-based access control tests' },
    { command: 'npm run test:api', desc: 'API endpoint tests' }
  ];

  let allTestsPassed = true;
  for (const test of testSuites) {
    const result = await runCommand('npm', ['run', test.command.split(' ')[2]], test.desc);
    allTestsPassed = allTestsPassed && result.success;
  }

  // Step 7: Summary
  log('\n📊 Integration Test Summary', 'cyan');
  log('=' .repeat(60), 'cyan');

  const results = [
    { name: 'Environment Configuration', passed: envResult.success },
    { name: 'Database Connection', passed: dbResult.success },
    { name: 'Authentication Files', passed: allFilesExist },
    { name: 'Dependencies', passed: depResult.success },
    { name: 'Code Quality (Lint)', passed: lintResult.success },
    { name: 'Authentication Tests', passed: allTestsPassed }
  ];

  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });

  const overallSuccess = results.every(r => r.passed);

  if (overallSuccess) {
    log('\n🎉 Phase 1 Integration Complete!', 'green');
    log('🚀 Authentication system is ready for production', 'green');
    log('\nNext steps:', 'blue');
    log('  • npm run dev (start development server)', 'blue');
    log('  • Test registration/login in browser', 'blue');
    log('  • Move to Phase 2: Performance & UX', 'blue');
  } else {
    log('\n⚠️ Integration tests failed', 'red');
    log('Please resolve the issues above before proceeding', 'yellow');
  }

  return overallSuccess;
}

// Run the integration tests
runIntegrationTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`💥 Integration test suite crashed: ${error.message}`, 'red');
    process.exit(1);
  });
