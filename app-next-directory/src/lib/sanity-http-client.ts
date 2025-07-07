/**
 * Advanced Sanity HTTP API Client
 * Day 1 Sprint: Complete HTTP API Client with Authentication & Error Handling
 * Date: May 24, 2025
 */

import { createClient } from './sanity/client'
import type { SanityClient } from '@sanity/client'
import { type SanityImageObject } from '@sanity/image-url/lib/types/types'
import type { SanityDocument } from '../types/sanity'

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
    if (!process.env.SANITY_API_TOKEN) {
      return false
    }

    // Test write permissions by attempting to create a test document
    const testDoc = {
      _type: 'authTest',
      title: 'Authentication Test',
      timestamp: new Date().toISOString(),
    }

    let result
    try {
      result = await this.writeClient.create(testDoc)
      if (result && (result as any).error) return false
    } catch (error: any) {
      return false
    }

    // Clean up test document
    try {
      await this.writeClient.delete((result as any)._id)
    } catch (cleanupError: any) {
      // Ignore cleanup errors for test contract
    }

    return true
  }

  // Query methods
  async query<T extends SanityDocument = SanityDocument>(
    query: string,
    params?: Record<string, any>,
    options?: { preview?: boolean }
  ): Promise<T> {
    try {
      const client = options?.preview
        ? this.client
        : this.client
      const result = await client.fetch<T>(query, params as any)
      if (result && (result as any).error) {
        throw new SanityAPIError(
          `Query failed: ${(result as any).error}`,
          (result as any).statusCode,
          result
        )
      }
      if (typeof result === 'undefined') {
        throw new SanityAPIError('Query failed: Query error')
      }
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
  async create(document: any): Promise<SanityDocument> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot create document: No API token provided')
    }
    try {
      const result = await this.writeClient.create(document)
      if (result && (result as any).error) {
        throw new SanityAPIError(
          `Create failed: ${(result as any).error}`,
          (result as any).statusCode,
          result
        )
      }
      if (typeof result === 'undefined') {
        throw new SanityAPIError('Create failed: Create error')
      }
      if (result) {
        if ((result as any)._id) {
          console.log(`✅ Created document: ${(result as any)._id}`)
        } else {
          console.log(`✅ Created document (no _id): ${JSON.stringify(result)}`)
        }
        return result
      }
      throw new SanityAPIError('Create operation returned no result')
    } catch (error: any) {
      throw new SanityAPIError(
        `Create failed: ${error.message}`,
        error.statusCode,
        error
      )
    }
  }

  // Update document
  async update(id: string, patches: any): Promise<SanityDocument> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot update document: No API token provided')
    }
    try {
      const patchObj = this.writeClient.patch(id)
      const setObj = patchObj.set(patches)
      if (typeof setObj.commit !== 'function') {
        throw new SanityAPIError('Update failed: commit is not a function')
      }
      let result
      try {
        result = await setObj.commit()
      } catch (error: any) {
        throw new SanityAPIError(
          `Update failed: ${error.message}`,
          error.statusCode,
          error
        )
      }
      if (result && (result as any).error) {
        throw new SanityAPIError(
          `Update failed: ${(result as any).error}`,
          (result as any).statusCode,
          result
        )
      }
      if (typeof result === 'undefined') {
        throw new SanityAPIError('Update failed: Update error')
      }
      if (!result) {
        throw new SanityAPIError('Update operation returned no result')
      }
      console.log(`✅ Updated document: ${id}`)
      return result
    } catch (error: any) {
      if (error instanceof SanityAPIError) throw error
      throw new SanityAPIError(
        `Update failed: ${error.message}`,
        error.statusCode,
        error
      )
    }
  }

  // Delete document
  async delete(id: string): Promise<any> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot delete document: No API token provided')
    }
    try {
      let result
      try {
        result = await this.writeClient.delete(id)
      } catch (error: any) {
        throw new SanityAPIError(
          `Delete failed: ${error.message}`,
          error.statusCode,
          error
        )
      }
      if (result && (result as any).error) {
        throw new SanityAPIError(
          `Delete failed: ${(result as any).error}`,
          (result as any).statusCode,
          result
        )
      }
      if (typeof result === 'undefined') {
        throw new SanityAPIError('Delete failed: Delete error')
      }
      console.log(`✅ Deleted document: ${id}`)
      return result
    } catch (error: any) {
      if (error instanceof SanityAPIError) throw error
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
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot upload asset: No API token provided')
    }
    try {
      if (
        !this.writeClient.assets ||
        typeof this.writeClient.assets.upload !== 'function'
      ) {
        throw new SanityAPIError('Asset upload failed: this.writeClient.assets.upload is not a function')
      }
      let asset: any
      try {
        asset = await this.writeClient.assets.upload('image', file, {
          filename: options?.filename,
          contentType: options?.contentType,
          title: options?.title,
          description: options?.description,
        })
      } catch (error: any) {
        throw new SanityAPIError(
          `Asset upload failed: ${error.message}`,
          error.statusCode || undefined,
          error
        )
      }
      if (asset && asset.error) {
        throw new SanityAPIError(
          `Asset upload failed: ${asset.error}`,
          asset.statusCode,
          asset
        )
      }
      if (typeof asset === 'undefined') {
        throw new SanityAPIError('Asset upload failed: Upload error')
      }
      if (!asset) {
        throw new SanityAPIError('Upload asset operation returned no result')
      }
      if (asset._id) {
        console.log(`✅ Uploaded asset: ${asset._id}`)
      } else {
        console.log(`✅ Uploaded asset (no _id): ${JSON.stringify(asset)}`)
      }
      return asset as unknown as SanityImageObject
    } catch (error: any) {
      if (error instanceof SanityAPIError) throw error
      throw new SanityAPIError(
        `Asset upload failed: ${error.message}`,
        error.statusCode || undefined,
        error
      )
    }
  }

  // Batch operations
  async createMany(documents: any[]): Promise<SanityDocument[]> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot create documents: No API token provided')
    }
    try {
      const transaction = this.writeClient.transaction()
      documents.forEach(doc => transaction.create(doc))

      let result: any
      try {
        result = await transaction.commit()
      } catch (error: any) {
        throw new SanityAPIError(
          `Batch create failed: ${error.message}`,
          error.statusCode || undefined,
          error
        )
      }
      if (result && result.error) {
        throw new SanityAPIError(
          `Batch create failed: ${result.error}`,
          result.statusCode,
          result
        )
      }
      if (typeof result === 'undefined') {
        throw new SanityAPIError('Batch create failed: Batch create error')
      }
      if (!result) {
        throw new SanityAPIError('Batch create operation returned no result')
      }
      // If result is an array, check for error objects in any element
      if (Array.isArray(result)) {
        if (result.some((item: any) => item && item.error)) {
          const errorItem = result.find((item: any) => item && item.error)
          throw new SanityAPIError(
            `Batch create failed: ${errorItem.error}`,
            errorItem.statusCode,
            errorItem
          )
        }
        if (typeof result[0] === 'string') {
          return result.map((id: string) => ({ _id: id })) as SanityDocument[]
        }
      }
      // If result itself is an error object
      if (result && result.error) {
        throw new SanityAPIError(
          `Batch create failed: ${result.error}`,
          result.statusCode,
          result
        )
      }
      return result
    } catch (error: any) {
      if (error instanceof SanityAPIError) throw error
      throw new SanityAPIError(
        `Batch create failed: ${error.message}`,
        error.statusCode || undefined,
        error
      )
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'ok' | 'error', details: any }> {
    try {
      // Test read access
      await this.query('*[_type == "sanity.fileAsset"][0]')

      // Test write access (if token available)
      let writeTest = false
      if (process.env.SANITY_API_TOKEN) {
        writeTest = await this.testAuthentication()
      }

      if (process.env.SANITY_API_TOKEN && writeTest === false) {
        return {
          status: 'error',
          details: { error: 'Unknown error' }
        }
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
    } catch (error: any) {
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
