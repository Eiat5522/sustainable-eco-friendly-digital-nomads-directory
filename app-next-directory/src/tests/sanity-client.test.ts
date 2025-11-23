/**
 * Sanity HTTP Client Test Suite
 * Day 1 Sprint: API Authentication Testing
 * Date: May 24, 2025
 */

import { SanityAPIError, sanityHTTPClient } from '../lib/sanity-http-client'

// Test suite for the HTTP client
export class SanityClientTester {

  async runAllTests(): Promise<void> {
    console.log('🧪 STARTING SANITY CLIENT TEST SUITE')
    console.log('=====================================')

    try {
      await this.testHealthCheck()
      await this.testAuthentication()
      await this.testReadOperations()

      if (process.env.SANITY_API_TOKEN) {
        await this.testWriteOperations()
      } else {
        console.log('⚠️ Skipping write tests - no API token provided')
      }

      console.log('\n✅ ALL TESTS PASSED!')
    } catch (error) {
      console.error('\n❌ TEST SUITE FAILED:', error)
      throw error
    }
  }

  async testHealthCheck(): Promise<void> {
    console.log('\n1. Testing Health Check...')

    const health = await sanityHTTPClient.healthCheck()
    console.log('Health status:', health.status)
    console.log('Details:', health.details)

    if (health.status !== 'ok') {
      throw new Error('Health check failed')
    }

    console.log('✅ Health check passed')
  }

  async testAuthentication(): Promise<void> {
    console.log('\n2. Testing Authentication...')

    if (!process.env.SANITY_API_TOKEN) {
      console.log('⚠️ No API token - skipping auth test')
      return
    }

    const isAuthenticated = await sanityHTTPClient.testAuthentication()

    if (!isAuthenticated) {
      throw new Error('Authentication test failed')
    }

    console.log('✅ Authentication test passed')
  }

  async testReadOperations(): Promise<void> {
    console.log('\n3. Testing Read Operations...')

    try {
      // Test basic query
      const result = await sanityHTTPClient.query('*[_type == "listing"][0..2]')
      console.log(`Found ${Array.isArray(result) ? result.length : 0} listings`)

      // Test query with parameters
      const cityQuery = `*[_type == "city" && defined(name)][0..1]{
        _id,
        name,
        country
      }`
      const cities = await sanityHTTPClient.query(cityQuery)
      console.log(`Found ${Array.isArray(cities) ? cities.length : 0} cities`)

      console.log('✅ Read operations passed')
    } catch (error) {
      console.error('❌ Read operations failed:', error)
      throw error
    }
  }

  async testWriteOperations(): Promise<void> {
    console.log('\n4. Testing Write Operations...')

    try {
      // Create test document
      const testDoc = {
        _type: 'testDocument',
        title: 'API Test Document',
        description: 'Created by HTTP client test suite',
        createdAt: new Date().toISOString(),
        testData: {
          environment: process.env.NODE_ENV,
          timestamp: Date.now()
        }
      }

      console.log('Creating test document...')
      const created = await sanityHTTPClient.create(testDoc)
      console.log(`Created document with ID: ${created._id}`)

      // Update test document
      console.log('Updating test document...')
      const updated = await sanityHTTPClient.update(created._id, {
        title: 'Updated API Test Document',
        updatedAt: new Date().toISOString()
      })
      console.log(`Updated document: ${updated._id}`)

      // Clean up - delete test document
      console.log('Cleaning up test document...')
      await sanityHTTPClient.delete(created._id)
      console.log('Test document deleted')

      console.log('✅ Write operations passed')
    } catch (error) {
      console.error('❌ Write operations failed:', error)
      throw error
    }
  }

  async testErrorHandling(): Promise<void> {
    console.log('\n5. Testing Error Handling...')

    try {
      // Test invalid query
      await sanityHTTPClient.query('INVALID GROQ QUERY')
    } catch (error) {
      if (error instanceof SanityAPIError) {
        console.log('✅ Error handling works - caught SanityAPIError')
      } else {
        throw new Error('Expected SanityAPIError but got different error type')
      }
    }
  }
}

// Export test runner function
export async function runSanityTests(): Promise<void> {
  const tester = new SanityClientTester()
  await tester.runAllTests()
}

// CLI runner (if run directly)
if (require.main === module) {
  runSanityTests()
    .then(() => {
      console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 TESTS FAILED:', error)
      process.exit(1)
    })
}
