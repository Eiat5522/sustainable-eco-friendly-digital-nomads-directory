/**
 * Advanced Sanity HTTP API Client
 * Day 1 Sprint: Complete HTTP API Client with Authentication & Error Handling
 * Date: May 24, 2025
 */

import { createClient } from './sanity/client'
import type { SanityClient } from '@sanity/client'
import { type SanityImageObject } from '@sanity/image-url/lib/types/types'

// Configuration interface
interface SanityConfig {
  projectId: string
  dataset: string
  apiVersion: string
  token?: string
  useCdn: boolean
  perspective?: 'published' | 'previewDrafts'
}

// Error types for better error handling
export class SanityAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message)
    this.name = 'SanityAPIError'
  }
}

// Main HTTP Client Class
export class SanityHTTPClient {
  private client: SanityClient
  private writeClient: SanityClient
  private config: SanityConfig

  constructor() {
    // Validate environment variables
    this.validateEnvironment()

    this.config = {
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2025-05-24',
      useCdn: process.env.NODE_ENV === 'production',
    }

    // Read-only client (public)
    this.client = createClient(this.config)

    // Write client with authentication
    this.writeClient = createClient({
      ...this.config,
      token: process.env.SANITY_API_TOKEN,
      useCdn: false, // Always use CDN for write operations
    })
  }

  private validateEnvironment(): void {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
    ]

    const optionalEnvVars = ['SANITY_API_TOKEN']

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new SanityAPIError(
          `Missing required environment variable: ${envVar}`
        )
      }
    }

    // Warn about missing optional vars
    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        console.warn(`Warning: Missing optional environment variable: ${envVar}`)
      }
    }
  }

  // Authentication test method
  async testAuthentication(): Promise<boolean> {
    try {
      if (!process.env.SANITY_API_TOKEN) {
        console.warn('No API token provided - read-only mode')
        return false
      }

      // Test write permissions by attempting to create a test document
      const testDoc = {
        _type: 'authTest',
        title: 'Authentication Test',
        timestamp: new Date().toISOString(),
      }

      const result = await this.writeClient.create(testDoc)

      // Clean up test document
      await this.writeClient.delete(result._id)

      console.log('✅ Sanity authentication successful')
      return true
    } catch (error) {
      console.error('❌ Sanity authentication failed:', error)
      return false
    }
  }

  // Query methods
  async query<T = any>(
    query: string,
    params?: Record<string, any>,
    options?: { preview?: boolean }
  ): Promise<T> {
    try {
      const client = options?.preview
        ? clientModule
        : this.client

      // @ts-expect-error: params typing workaround for Sanity client
      const result = await client.fetch<T>(query, params as any)
      return result
    } catch (error: any) {
      throw new SanityAPIError(
        `Query failed: ${error.message}`,
        error.statusCode,
        error
      )
    }
  }

  // Create document
  async create<T = any>(document: any): Promise<T> {
    try {
      if (!process.env.SANITY_API_TOKEN) {
        throw new SanityAPIError('Cannot create document: No API token provided')
      }

      const result = await this.writeClient.create(document)
      console.log(`✅ Created document: ${result._id}`)
      return result
    } catch (error: any) {
      throw new SanityAPIError(
        `Create failed: ${error.message}`,
        error.statusCode,
        error
      )
    }
  }

  // Update document
  async update<T = any>(id: string, patches: any): Promise<T> {
    try {
      if (!process.env.SANITY_API_TOKEN) {
        throw new SanityAPIError('Cannot update document: No API token provided')
      }

      const result = await this.writeClient.patch(id).set(patches).commit()
      console.log(`✅ Updated document: ${id}`)
      return result
    } catch (error: any) {
      throw new SanityAPIError(
        `Update failed: ${error.message}`,
        error.statusCode,
        error
      )
    }
  }

  // Delete document
  async delete(id: string): Promise<any> {
    try {
      if (!process.env.SANITY_API_TOKEN) {
        throw new SanityAPIError('Cannot delete document: No API token provided')
      }

      const result = await this.writeClient.delete(id)
      console.log(`✅ Deleted document: ${id}`)
      return result
    } catch (error: any) {
      throw new SanityAPIError(
        `Delete failed: ${error.message}`,
        error.statusCode,
        error
      )
    }
  }

  // Upload asset (image/file)
  async uploadAsset(
    file: File | Buffer,
    options?: {
      filename?: string
      contentType?: string
      title?: string
      description?: string
    }
  ): Promise<SanityImageObject> {
    try {
      if (!process.env.SANITY_API_TOKEN) {
        throw new SanityAPIError('Cannot upload asset: No API token provided')
      }

      const asset = await this.writeClient.assets.upload('image', file, {
        filename: options?.filename,
        contentType: options?.contentType,
        title: options?.title,
        description: options?.description,
      })

      console.log(`✅ Uploaded asset: ${asset._id}`)
      return asset as SanityImageObject
    } catch (error: any) {
      throw new SanityAPIError(
        `Asset upload failed: ${error.message}`,
        error.statusCode,
        error
      )
    }
  }

  // Batch operations
  async createMany<T = any>(documents: any[]): Promise<T[]> {
    try {
      if (!process.env.SANITY_API_TOKEN) {
        throw new SanityAPIError('Cannot create documents: No API token provided')
      }

      const transaction = this.writeClient.transaction()
      documents.forEach(doc => transaction.create(doc))

      const result = await transaction.commit()
      console.log(`✅ Created ${documents.length} documents`)
      return result
    } catch (error: any) {
      throw new SanityAPIError(
        `Batch create failed: ${error.message}`,
        error.statusCode,
        error
      )
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'ok' | 'error', details: any }> {
    try {
      // Test read access
      const readTest = await this.query('*[_type == "sanity.fileAsset"][0]')

      // Test write access (if token available)
      let writeTest = false
      if (process.env.SANITY_API_TOKEN) {
        writeTest = await this.testAuthentication()
      }

      return {
        status: 'ok',
        details: {
          projectId: this.config.projectId,
          dataset: this.config.dataset,
          readAccess: true,
          writeAccess: writeTest,
          hasToken: !!process.env.SANITY_API_TOKEN,
          environment: process.env.NODE_ENV,
        }
      }
    } catch (error) {
      return {
        status: 'error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // Get client for direct access if needed
  getReadClient(): SanityClient {
    return this.client
  }

  getWriteClient(): SanityClient {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot get write client: No API token provided')
    }
    return this.writeClient
  }
}

// Export singleton instance
export const sanityHTTPClient = new SanityHTTPClient()

// Export client getter functions for backward compatibility
export const getClient = (preview = false) => {
  if (preview) {
    return createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2025-05-24',
      useCdn: false,
      perspective: 'previewDrafts',
    })
  }
  return sanityHTTPClient.getReadClient()
}

// Do not use export default for ESM/CJS compatibility
