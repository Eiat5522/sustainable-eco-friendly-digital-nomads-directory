import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const requiredEnvVars = [
  'SANITY_STUDIO_PROJECT_ID',
  'SANITY_STUDIO_DATASET',
  'SANITY_STUDIO_API_VERSION',
  'SANITY_STUDIO_PREVIEW_SECRET',
  'NEXT_PUBLIC_FRONTEND_URL'
]

const optionalEnvVars = [
  'SANITY_STUDIO_API_TOKEN',
  'SANITY_STUDIO_CORS_ORIGINS',
  'SANITY_STUDIO_WEBHOOK_URL',
  'SANITY_STUDIO_WEBHOOK_SECRET'
]

async function verifyEnvironment() {
  console.log('🔍 Verifying Sanity Studio environment...\n')

  // Check required environment variables
  const missingRequired = requiredEnvVars.filter(v => !process.env[v])
  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingRequired.forEach(v => console.error(`   - ${v}`))
    process.exit(1)
  }
  console.log('✅ All required environment variables are set')

  // Check optional environment variables
  const missingOptional = optionalEnvVars.filter(v => !process.env[v])
  if (missingOptional.length > 0) {
    console.warn('\n⚠️ Missing optional environment variables:')
    missingOptional.forEach(v => console.warn(`   - ${v}`))
  }

  // Verify Sanity client connection
  const client = createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
    apiVersion: process.env.SANITY_STUDIO_API_VERSION,
    useCdn: false,
    token: process.env.SANITY_STUDIO_API_TOKEN
  })

  try {
    await client.fetch('*[_type == "sanity.imageAsset"][0]')
    console.log('\n✅ Successfully connected to Sanity project')
  } catch (error) {
    console.error('\n❌ Failed to connect to Sanity project:', error.message)
    process.exit(1)
  }

  // Verify preview URL
  const previewUrl = new URL('/api/preview', process.env.NEXT_PUBLIC_FRONTEND_URL)
  try {
    const response = await fetch(previewUrl.toString())
    if (response.ok) {
      console.log('✅ Preview endpoint is accessible')
    } else {
      console.warn('⚠️ Preview endpoint returned status:', response.status)
    }
  } catch (error) {
    console.warn('⚠️ Could not verify preview endpoint:', error.message)
  }

  console.log('\n✨ Environment verification complete')
}

verifyEnvironment().catch(error => {
  console.error('❌ Verification failed:', error.message)
  process.exit(1)
})
