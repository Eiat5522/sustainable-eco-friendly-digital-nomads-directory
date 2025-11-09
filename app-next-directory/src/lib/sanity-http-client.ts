/**
 * Advanced Sanity HTTP API Client
 * Day 1 Sprint: Complete HTTP API Client with Authentication & Error Handling
 * Date: May 24, 2025
 */

// Import core Sanity client types and methods
import { createClient as sanityCreateClient } from './sanity/client';
import type { SanityClient, Patch } from '@sanity/client';
// Import generated types from sanity.types.ts.
// The path '../../sanity/sanity.types' is assumed based on the file structure.
import type {
  SanityDocument as GeneratedSanityDocument,
  SanityAssetDocument as GeneratedSanityAssetDocument,
  SanityImageAsset as ignoredSanityImageAsset, // Assuming SanityImageAsset is also generated or a common type
  SanityFileAsset as ignoredSanityFileAsset, // Assuming SanityFileAsset is also generated or a common type
  Geopoint as ignoredGeopoint,
  Slug as ignoredSlug,
  SanityImageHotspot as ignoredSanityImageHotspot,
  SanityImageCrop as ignoredSanityImageCrop,
  SanityImageMetadata as ignoredSanityImageMetadata,
  SanityImageDimensions as ignoredSanityImageDimensions,
  SanityImagePalette as ignoredSanityImagePalette,
  SanityImagePaletteSwatch as ignoredSanityImagePaletteSwatch,
  SanityAssetSourceData as ignoredSanityAssetSourceData,
  // Import specific query result types if needed for direct use, e.g.:
  // LISTING_BY_SLUG_QUERYResult, GetCitySummaryBySlugQueryResult
} from '../../sanity/sanity.types';
// Import custom types if they are not generated or part of @sanity/client
import type { SanityImageObject } from '../types/external/sanity-image'; // This seems to be a custom type

// Configuration interface
interface SanityConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token?: string;
  useCdn: boolean;
  perspective?: 'published' | 'previewDrafts';
}

type ConfigurableSanityClient = SanityClient & {
  withConfig?: (config: Partial<SanityConfig>) => SanityClient;
};

const extractStatusCode = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const value = (error as { statusCode?: unknown }).statusCode;
    return typeof value === 'number' ? value : undefined;
  }
  return undefined;
};

// Error types for better error handling
export class SanityAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown // Changed from any to unknown for better type safety
  ) {
    super(message);
    this.name = 'SanityAPIError';
  }
}

// Main HTTP Client Class
export class SanityHTTPClient {
  private client: SanityClient;
  private writeClient: SanityClient;
  private config: SanityConfig;
  private readonly debug = process.env.SANITY_HTTP_DEBUG === '1';

  constructor() {
    // Validate environment variables
    this.validateEnvironment();

    this.config = {
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2025-05-24',
      useCdn: process.env.NODE_ENV === 'production',
    };

    // Read-only client (public)
    this.client = sanityCreateClient(this.config);

    // Write client with authentication
    this.writeClient = sanityCreateClient({
      ...this.config,
      token: process.env.SANITY_API_TOKEN,
      useCdn: false, // Never use CDN for write operations
    });
  }

  private validateEnvironment(): void {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
    ];

    const optionalEnvVars = ['SANITY_API_TOKEN'];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new SanityAPIError(
          `Missing required environment variable: ${envVar}`
        );
      }
    }

    // Warn about missing optional vars
    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        console.warn(`Warning: Missing optional environment variable: ${envVar}`);
      }
    }
  }

  // Authentication test method
  async testAuthentication(): Promise<boolean> {
    if (!process.env.SANITY_API_TOKEN) {
      return false;
    }

    // Test write permissions by attempting to create a test document
    // Use Partial<GeneratedSanityDocument> for the input document.
    const testDoc: Partial<GeneratedSanityDocument> = {
      _type: 'authTest', // Assuming 'authTest' is a valid type in your schema
      title: 'Authentication Test',
      timestamp: new Date().toISOString(),
    };

    let result: GeneratedSanityDocument | undefined; // Typed as GeneratedSanityDocument | undefined
    try {
      // The create method should now return GeneratedSanityDocument due to typegen overload.
      result = await this.writeClient.create(testDoc);
      // The create method typically throws on error, so if we get here, it's likely successful.
      // We check for _id as a common indicator of a successful creation.
      if (!result || !result._id) {
        // This case might indicate an unexpected response structure from the client
        return false;
      }
    } catch (error: unknown) { // Catching unknown for better type safety
      // If an error is caught, authentication likely failed.
      if (this.debug) console.error('Authentication test failed during create:', error);
      return false;
    }
    // Clean up test document
    try {
      // Ensure result._id is a string before deleting
      if (result._id) {
        await this.writeClient.delete(result._id);
      }
    } catch (cleanupError: unknown) { // Catching unknown for better type safety
      // Ignore cleanup errors for test contract
      if (this.debug) console.error('Error during auth test cleanup:', cleanupError);
    }

    return true;
  }

  // Query methods
  // T can be a specific generated query result type or 'unknown' for generic queries.
  async query<T = unknown>(
    query: string,
    params?: Record<string, unknown>,
    options?: { preview?: boolean }
  ): Promise<T> {
    try {
      // The SanityClient.withConfig method is used to create a new client instance
      // with specific configurations like perspective and token for previewing drafts.
      const configurableClient = this.client as ConfigurableSanityClient;
      const client =
        options?.preview && typeof configurableClient.withConfig === 'function'
          ? configurableClient.withConfig({
              useCdn: false,
              perspective: 'previewDrafts',
              token: process.env.SANITY_API_TOKEN,
            })
          : this.client;

      // The fetch method should now return T based on the query and typegen overload.
      const result = await client.fetch<T>(query, params);

      // If the result is undefined, it might indicate an issue with the query or data fetching.
      if (typeof result === 'undefined') {
        throw new SanityAPIError('Query failed: No data returned');
      }
      return result;
    } catch (error: unknown) { // Catching unknown for better type safety
      // If an error is caught, wrap it in SanityAPIError for consistent handling.
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      // Attempt to extract statusCode if it exists on the error object.
      const statusCode = extractStatusCode(error);
      throw new SanityAPIError(`Query failed: ${errorMessage}`, statusCode, error);
    }
  }

  // Create document
  // Use Partial<GeneratedSanityDocument> for the input document, and GeneratedSanityDocument for the return type.
  async create(document: Partial<GeneratedSanityDocument>): Promise<GeneratedSanityDocument> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot create document: No API token provided');
    }
    try {
      // The create method should now return GeneratedSanityDocument due to typegen overload.
      const result = await this.writeClient.create(document);
      if (this.debug) {
        if (result && result._id) {
          console.log(`✅ Created document: ${result._id}`);
        } else {
          console.log(`✅ Created document (no _id): ${JSON.stringify(result)}`);
        }
      }
      return result;
    } catch (error: unknown) { // Catching unknown for better type safety
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const statusCode = extractStatusCode(error);
      throw new SanityAPIError(`Create failed: ${errorMessage}`, statusCode, error);
    }
  }

  // Update document
  // Use Patch for patches and GeneratedSanityDocument for the return type.
  async update(id: string, patches: Patch): Promise<GeneratedSanityDocument> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot update document: No API token provided');
    }
    try {
      // The patch method returns a Patch object, which has a commit method.
      const patchObj = this.writeClient.patch(id);
      // The set method on the patch object expects an object for the patches.
      // Use the imported Patch type.
      const setObj = patchObj.set(patches);

      // Ensure commit is a function before calling
      if (typeof setObj.commit !== 'function') {
        throw new SanityAPIError('Update failed: commit is not a function on the patch object');
      }

      let result: GeneratedSanityDocument; // Typed result
      try {
        result = await setObj.commit(); // commit should return GeneratedSanityDocument
      } catch (error: unknown) { // Catching unknown for better type safety
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        const statusCode = extractStatusCode(error);
        throw new SanityAPIError(`Update failed: ${errorMessage}`, statusCode, error);
      }

      if (!result) {
        throw new SanityAPIError('Update operation returned no result');
      }
      if (this.debug) console.log(`✅ Updated document: ${id}`);
      return result;
    } catch (error: unknown) { // Catching unknown for better type safety
      if (error instanceof SanityAPIError) throw error; // Re-throw if it's already our custom error
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const statusCode = extractStatusCode(error);
      throw new SanityAPIError(`Update failed: ${errorMessage}`, statusCode, error);
    }
  }

  // Delete document
  // The return type of delete can be null or a status object. We expose it as unknown for flexibility.
  async delete(id: string): Promise<unknown> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot delete document: No API token provided');
    }
    try {
      const result = await this.writeClient.delete(id); // delete returns null or a status object
      if (this.debug) console.log(`✅ Deleted document: ${id}`);
      return result;
    } catch (error: unknown) { // Catching unknown for better type safety
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const statusCode = extractStatusCode(error);
      throw new SanityAPIError(`Delete failed: ${errorMessage}`, statusCode, error);
    }
  }

  // Upload asset (image/file)
  // Use File | Buffer for file input, SanityImageObject for return.
  // Use GeneratedSanityAssetDocument for the intermediate asset type.
  async uploadAsset(
    file: File | Buffer,
    options?: {
      filename?: string;
      contentType?: string;
      title?: string;
      description?: string;
    }
  ): Promise<SanityImageObject> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot upload asset: No API token provided');
    }
    try {
      // Ensure the assets API and upload method exist
      if (
        !this.writeClient.assets ||
        typeof this.writeClient.assets.upload !== 'function'
      ) {
        throw new SanityAPIError('Asset upload failed: Sanity client assets API not available');
      }

      // Enforce image content type
      const contentType = options?.contentType ?? '';
      if (contentType && !contentType.startsWith('image/')) {
        throw new SanityAPIError(
          'Asset upload failed: Only image/* content types are supported by uploadAsset()'
        );
      }

      let asset: GeneratedSanityAssetDocument; // Typed as GeneratedSanityAssetDocument
      try {
        // The upload method expects the asset type ('image' or 'file') as the first argument.
        // It returns a SanityAssetDocument. Use the generated type.
        asset = await this.writeClient.assets.upload('image', file, {
          filename: options?.filename,
          contentType: contentType || undefined,
          title: options?.title,
          description: options?.description,
        });
      } catch (error: unknown) { // Catching unknown for better type safety
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        const statusCode = extractStatusCode(error);
        throw new SanityAPIError(`Asset upload failed: ${errorMessage}`, statusCode, error);
      }

      // The upload method should return a SanityAssetDocument on success.
      // Check for _id as a sign of success.
      if (!asset || !asset._id) {
        throw new SanityAPIError('Asset upload failed: Invalid asset document returned');
      }

      if (this.debug) console.log(`✅ Uploaded asset: ${asset._id}`);

      // Convert asset document to a Sanity image field object
      // Use the custom SanityImageObject type.
      const imageObject: SanityImageObject = {
        _type: 'image', // Literal type 'image'
        asset: {
          _type: 'reference', // Literal type 'reference'
          _ref: asset._id, // Use the typed _id from GeneratedSanityAssetDocument
        },
      };
      return imageObject;
    } catch (error: unknown) { // Catching unknown for better type safety
      if (error instanceof SanityAPIError) throw error; // Re-throw if it's already our custom error
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const statusCode = extractStatusCode(error);
      throw new SanityAPIError(`Asset upload failed: ${errorMessage}`, statusCode, error);
    }
  }

  // Create many documents
  // Use Partial<GeneratedSanityDocument>[] for input and GeneratedSanityDocument[] for output.
  async createMany(documents: Partial<GeneratedSanityDocument>[]): Promise<GeneratedSanityDocument[]> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot create documents: No API token provided');
    }
    try {
      const tx = this.writeClient.transaction();
      for (const doc of documents) {
        tx.create(doc);
      }
      // Type the commitResult based on the expected structure when returnDocuments: true
      // The results array should contain objects with a 'document' property of type GeneratedSanityDocument.
      let commitResult: { results?: { document?: GeneratedSanityDocument }[]; error?: string; statusCode?: number };
      try {
        commitResult = await tx.commit({ returnDocuments: true });
      } catch (error: unknown) { // Catching unknown for better type safety
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        const statusCode = extractStatusCode(error);
        throw new SanityAPIError(`Batch create failed: ${errorMessage}`, statusCode, error);
      }

      // The structure of commitResult can vary. We expect an array of results, each potentially containing a document.
      const results = commitResult?.results;
      if (!Array.isArray(results)) {
        const errorMsg = commitResult?.error || 'Batch create error: Invalid response structure';
        throw new SanityAPIError(
          `Batch create failed: ${errorMsg}`,
          commitResult?.statusCode,
          commitResult
        );
      }

      // Extract documents from the results array. Each item in results might be { document: SanityDocument } or just SanityDocument.
      // Use GeneratedSanityDocument for the extracted documents.
      const createdDocs = results
        .map((r: { document?: GeneratedSanityDocument }) => r?.document) // Safely access document
        .filter((doc): doc is GeneratedSanityDocument => doc !== undefined); // Filter out undefined and assert type

      if (!createdDocs.length && documents.length > 0) { // If we expected docs but got none
        throw new SanityAPIError(
          'Batch create operation returned no documents',
          commitResult?.statusCode,
          commitResult
        );
      }
      return createdDocs;
    } catch (error: unknown) { // Catching unknown for better type safety
      if (error instanceof SanityAPIError) throw error; // Re-throw if it's already our custom error
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const statusCode = extractStatusCode(error);
      throw new SanityAPIError(`Batch create failed: ${errorMessage}`, statusCode, error);
    }
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'ok' | 'error'; details: Record<string, unknown> }> {
    try {
      // Test read access
      // The query method itself handles errors, so a successful call implies read access.
      // We can use a generic query here, or a specific one if we know a reliable type.
      // For now, using a generic query and 'unknown' for the result type.
      await this.query<unknown>('*[_type == "sanity.fileAsset"][0]');

      // Test write access (if token available)
      let writeTest = false;
      if (process.env.SANITY_API_TOKEN) {
        writeTest = await this.testAuthentication();
        if (!writeTest) {
          // If testAuthentication returns false, it means write access failed.
          return {
            status: 'error',
            details: { error: 'Write access test failed', hasToken: true },
          };
        }
      }

      // Success path
      return {
        status: 'ok',
        details: {
          projectId: this.config.projectId,
          dataset: this.config.dataset,
          readAccess: true,
          writeAccess: writeTest,
          hasToken: !!process.env.SANITY_API_TOKEN,
          environment: process.env.NODE_ENV,
        },
      };
    } catch (error: unknown) { // Catching unknown for better type safety
      // If any part of the health check fails, return an error status.
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        status: 'error',
        details: { error: errorMessage },
      };
    }
  }

  // Get client for direct access if needed
  getReadClient(): SanityClient {
    return this.client;
  }

  getWriteClient(): SanityClient {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot get write client: No API token provided');
    }
    return this.writeClient;
  }
}

// Lazy singleton instance
let _sanityHTTPClient: SanityHTTPClient | null = null;
export const getSanityHTTPClient = (): SanityHTTPClient => {
  if (!_sanityHTTPClient) _sanityHTTPClient = new SanityHTTPClient();
  return _sanityHTTPClient;
};

// Backward-compatible accessor that lazily proxies to the singleton instance
// This proxy might need adjustment if SanityHTTPClient itself has complex internal structures
// that are not meant to be proxied directly. For now, it proxies all properties.
export const sanityHTTPClient: SanityHTTPClient = new Proxy({} as SanityHTTPClient, {
  get(_target, prop) {
    // Ensure we are accessing properties of the actual instance
    const instance = getSanityHTTPClient();
    return (instance as Record<PropertyKey, unknown>)[prop as PropertyKey];
  },
});

// Export client getter functions for backward compatibility
export const getClient = (preview = false) => {
  if (preview) {
    // This creates a new client instance specifically for previewing drafts.
    // It uses the public project ID and dataset, but explicitly sets perspective to 'previewDrafts'
    // and provides the API token for draft access. useCdn is set to false.
    return sanityCreateClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2025-05-24',
      useCdn: false,
      perspective: 'previewDrafts',
      token: process.env.SANITY_API_TOKEN, // Ensure token is passed for preview
    });
  }
  // For non-preview, it returns the read-only client from the singleton instance.
  return getSanityHTTPClient().getReadClient();
};

// Do not use export default for ESM/CJS compatibility
