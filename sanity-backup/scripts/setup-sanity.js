/**
 * Sanity Studio Setup Helper
 * This script helps verify and test your Sanity configuration
 */

import dotenv from 'dotenv'
import { createClient } from '@sanity/client'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../.env') })

// Function to validate environment setup
async function validateSetup() {
  console.log('🔍 Validating Sanity Studio setup...\n')
  
  // Check required environment variables
  const requiredVars = [
    'SANITY_STUDIO_PROJECT_ID',
    'SANITY_STUDIO_DATASET',
    'SANITY_TEST_TOKEN'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    return false
  }

  // Try to connect to Sanity
  const client = createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
    apiVersion: process.env.SANITY_STUDIO_API_VERSION || '2023-05-03',
    token: process.env.SANITY_TEST_TOKEN,
    useCdn: false
  })

  try {
    const result = await client.fetch('*[_type == "listing"][0...1]')
    console.log('✅ Successfully connected to Sanity')
    console.log(`✅ Found ${result.length} listing(s) in dataset`)
    return true
  } catch (error) {
    console.error('❌ Error connecting to Sanity:')
    console.error(error.message)
    return false
  }
}

// Function to provide setup instructions
function printSetupInstructions() {
  console.log('\n📝 Setup Instructions:\n')
  console.log('1. Visit https://www.sanity.io/manage')
  console.log('2. Select your project')
  console.log('3. Go to "API" tab')
  console.log('4. Under "Tokens", create a new token with "Editor" rights')
  console.log('5. Copy the token')
  console.log('6. Add it to your .env file as SANITY_TEST_TOKEN\n')
}

async function verifySanitySetup() {
  console.log('🔍 Verifying Sanity setup and security...');

  // Check dependencies
  const depCheck = await checkDependencies();
  if (!depCheck.success) {
    throw new Error(`Dependency check failed: ${depCheck.error}`);
  }

  // Verify security settings
  const securityCheck = await verifySecuritySettings();
  if (!securityCheck.success) {
    throw new Error(`Security verification failed: ${securityCheck.error}`);
  }

  // Verify API configuration
  await verifyApiConfig();

  console.log('✅ Sanity setup verification complete');
}

async function verifySecuritySettings() {
  try {
    const config = await import('../sanity.config.js');
    const security = config.default.security || {};

    // Verify CSP
    if (!security.contentSecurityPolicy?.directives) {
      return { success: false, error: 'Missing Content Security Policy' };
    }

    // Verify CORS
    if (!security.cors?.origin) {
      return { success: false, error: 'Missing CORS configuration' };
    }

    // Verify authentication
    if (!security.authentication?.requireLogin) {
      return { success: false, error: 'Authentication not properly configured' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  const isValid = await validateSetup()
  if (!isValid) {
    printSetupInstructions()
    process.exit(1)
  }
  try {
    await verifySanitySetup();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
  console.log('\n✨ Setup validation complete!\n')
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
