import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { promises as fs } from 'fs'
import path from 'path'

dotenv.config()

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'sc70w3cr',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: process.env.SANITY_STUDIO_API_VERSION || '2025-05-15',
  useCdn: false,
  token: process.env.SANITY_STUDIO_API_TOKEN
})

async function testStudioConfig() {
  console.log('🔄 Testing Sanity Studio configuration...\n')

  try {
    // Test studio configuration file
    console.log('Checking Sanity Studio configuration...')
    const configPath = path.join(process.cwd(), 'sanity.config.js')
    await fs.access(configPath)
    console.log('✅ Studio configuration file exists')

    // Test preview configuration
    console.log('\nChecking preview configuration...')
    const previewSecret = process.env.SANITY_STUDIO_PREVIEW_SECRET
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
    if (!previewSecret) console.warn('⚠️ Preview secret not configured')
    if (!frontendUrl) console.warn('⚠️ Frontend URL not configured')
    if (previewSecret && frontendUrl) console.log('✅ Preview configuration verified')

    // Test scheduled publishing configuration
    console.log('\nChecking scheduled publishing...')
    const plugins = await client.request({ url: '/plugins' })
    const hasScheduledPublishing = plugins.some(p => p.name === 'scheduled-publishing')
    if (hasScheduledPublishing) {
      console.log('✅ Scheduled publishing plugin configured')
    } else {
      console.warn('⚠️ Scheduled publishing plugin not detected')
    }

    // Test media plugin configuration
    console.log('\nChecking media plugin...')
    const hasMediaPlugin = plugins.some(p => p.name === 'media')
    if (hasMediaPlugin) {
      console.log('✅ Media plugin configured')
    } else {
      console.warn('⚠️ Media plugin not detected')
    }

    // Test vision tool configuration
    console.log('\nChecking Vision tool...')
    const hasVisionTool = plugins.some(p => p.name === 'vision')
    if (hasVisionTool) {
      console.log('✅ Vision tool configured')
    } else {
      console.warn('⚠️ Vision tool not detected')
    }

    console.log('\n✨ Studio configuration verification complete')
  } catch (error) {
    console.error('\n❌ Configuration verification failed:', error.message)
    process.exit(1)
  }
}

testStudioConfig().catch(console.error)
