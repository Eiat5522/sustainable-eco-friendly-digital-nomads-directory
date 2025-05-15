import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config()

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'sc70w3cr',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: process.env.SANITY_STUDIO_API_VERSION || '2025-05-15',
  useCdn: false,
  token: process.env.SANITY_STUDIO_API_TOKEN
})

async function testConnection() {
  console.log('🔄 Testing Sanity Studio connection...\n')

  try {
    // Test basic connectivity
    const projectInfo = await client.request({ url: '/' })
    console.log('✅ Connected to Sanity project:', projectInfo.name)

    // Test content querying
    const imageAssets = await client.fetch('*[_type == "sanity.imageAsset"][0...5]')
    console.log(`✅ Successfully queried content (found ${imageAssets.length} image assets)`)

    // Test schema access
    const schemas = await client.fetch('*[_type == "schema.type"]')
    console.log('✅ Schema access verified')

    // Test dataset access
    const datasets = await client.request({ url: '/datasets' })
    console.log(`✅ Dataset access verified (using '${datasets[0].name}')`)

    // Test GROQ query
    const result = await client.fetch('*[_type in ["listing", "blogPost", "event"]][0...5]')
    console.log(`✅ GROQ query successful (found ${result.length} documents)`)

    console.log('\n✨ All connection tests passed!')
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message)
    process.exit(1)
  }
}

testConnection().catch(console.error)
