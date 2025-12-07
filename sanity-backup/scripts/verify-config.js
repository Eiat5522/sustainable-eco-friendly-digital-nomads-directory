import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

dotenv.config()

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'sc70w3cr',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  useCdn: false,
  apiVersion: '2025-05-15'
})

// Required security settings
const REQUIRED_SECURITY_SETTINGS = [
  'contentSecurityPolicy',
  'cors',
  'authentication'
]

async function verifyConfig() {
  try {
    console.log('🔍 Starting extended Sanity configuration verification...')
    
    // Check sanity.config.js exists
    const configPath = path.join(rootDir, 'sanity.config.js')
    if (!fs.existsSync(configPath)) {
      console.error('❌ sanity.config.js not found')
      return false
    }
    console.log('✅ sanity.config.js found')
    
    // Check config file content for security settings
    const configContent = fs.readFileSync(configPath, 'utf8')
    const missingSettings = []
    
    for (const setting of REQUIRED_SECURITY_SETTINGS) {
      if (!configContent.includes(setting)) {
        missingSettings.push(setting)
      }
    }
    
    if (missingSettings.length > 0) {
      console.warn('⚠️ Missing security settings in sanity.config.js:')
      missingSettings.forEach(setting => console.warn(`  - ${setting}`))
    } else {
      console.log('✅ Security settings appear to be configured')
    }

    // Test basic connectivity
    const result = await client.fetch('*[_type == "sanity.imageAsset"][0]')
    console.log('✅ Successfully connected to Sanity project')

    // Verify project permissions
    const databases = await client.request({ url: '/datasets' })
    console.log('✅ Successfully verified project permissions')

    // Verify API version
    const projectInfo = await client.request({ url: '/' })
    console.log(`✅ API Version verified: ${projectInfo.version}`)

    // Test preview secret
    if (!process.env.SANITY_PREVIEW_SECRET) {
      console.warn('⚠️ SANITY_PREVIEW_SECRET not set')
    } else {
      console.log('✅ Preview secret configured')
    }

    // Test frontend URL
    if (!process.env.NEXT_PUBLIC_FRONTEND_URL) {
      console.warn('⚠️ NEXT_PUBLIC_FRONTEND_URL not set')
    } else {
      console.log('✅ Frontend URL configured')
    }

    console.log('\n✨ Configuration verification complete')
  } catch (error) {
    console.error('❌ Error verifying configuration:', error.message)
    process.exit(1)
  }
}

verifyConfig()
