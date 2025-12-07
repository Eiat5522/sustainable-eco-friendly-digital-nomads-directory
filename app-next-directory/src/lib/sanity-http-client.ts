import type { QueryParams, SanityClient } from '@sanity/client';
import { structuredLogger } from '@/lib/logger';
import type { SanityDocument as GeneratedSanityDocument } from '@/types/sanity';
// Import core Sanity client types and methods
import { createClient as sanityCreateClient } from './sanity/client';

type GeneratedSanityAssetDocument = Record<string, unknown> & { _id: string };
type SanityDocumentInput = { _type: string } & Record<string, unknown>;

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

type ErrorPayload = { error?: unknown; statusCode?: number };

const getErrorPayload = (value: unknown): ErrorPayload | null => {
  if (value && typeof value === 'object' && 'error' in value) {
    return value as ErrorPayload;
  }
  return null;
};

const formatErrorMessage = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (value instanceof Error && value.message) return value.message;
  if (value == null) return fallback;
  return String(value);
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
    // FORTEST: Skip validation and client creation when DISABLE_SANITY_DURING_BUILD is set
    const disableSanity = process.env.DISABLE_SANITY_DURING_BUILD === '1' || process.env.DISABLE_SANITY_DURING_BUILD === 'true';
    
    if (disableSanity) {
      // Create stub config and clients that won't make network calls
      this.config = {
        projectId: 'disabled',
        dataset: 'disabled',
        apiVersion: '2025-05-24',
        useCdn: false,
      };
      
      // Create stub client inline to avoid importing the module
      const stubClient: SanityClient = {
        fetch: async () => null,
        getDocument: async () => null,
        create: async (doc: any) => doc,
        patch: () => ({
          set: () => ({ commit: async () => ({}) }),
          setIfMissing: () => ({ commit: async () => ({}) }),
        }),
        transaction: () => ({
          create: () => {},
          commit: async () => ({}),
        }),
      } as unknown as SanityClient;
      
      this.client = stubClient;
      this.writeClient = stubClient;
      return;
    }
    
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
    const requiredEnvVars = ['NEXT_PUBLIC_SANITY_PROJECT_ID', 'NEXT_PUBLIC_SANITY_DATASET'];

    const optionalEnvVars = ['SANITY_API_TOKEN'];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new SanityAPIError(`Missing required environment variable: ${envVar}`);
      }
    }

    // Warn about missing optional vars
    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        structuredLogger.warn(`Missing optional environment variable: ${envVar}`, {
          component: 'sanity-http',
        });
      }
    }
  }

  // Authentication test method
  async testAuthentication(): Promise<boolean> {
    if (!process.env.SANITY_API_TOKEN) {
      return false;
    }

    // Test write permissions by attempting to create a test document
    // Use SanityDocumentInput for the input document.
    const testDoc: SanityDocumentInput = {
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
    } catch (error: unknown) {
      // Catching unknown for better type safety
      // If an error is caught, authentication likely failed.
      if (this.debug) {
        structuredLogger.warn('Sanity auth test failed', error, {
          component: 'sanity-http-client',
        });
      }
      return false;
    }
    // Clean up test document
    try {
      // Ensure result._id is a string before deleting
      if (result?._id) {
        await this.writeClient.delete(String(result._id));
      }
    } catch (_cleanupError: unknown) {
      // Catching unknown for better type safety
      // Ignore cleanup errors for test contract
    }

    return true;
  }

  // Query methods
  // T can be a specific generated query result type or 'unknown' for generic queries.
  async query<T = unknown>(
    query: string,
    params?: QueryParams,
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
      const result = await client.fetch<T>(query, params as QueryParams);
      const errorPayload = getErrorPayload(result);
      if (errorPayload?.error) {
        const message = formatErrorMessage(errorPayload.error, 'Query error');
        throw new SanityAPIError(
          `Query failed: ${message}`,
          extractStatusCode(errorPayload),
          errorPayload
        );
      }

      // If the result is undefined, it might indicate an issue with the query or data fetching.
      if (typeof result === 'undefined') {
        throw new SanityAPIError('Query failed: Query error');
      }

      return result;
    } catch (error: unknown) {
      // Catching unknown for better type safety
      // If an error is caught, wrap it in SanityAPIError for consistent handling.
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      // Attempt to extract statusCode if it exists on the error object.
      const statusCode = extractStatusCode(error);
      throw new SanityAPIError(`Query failed: ${errorMessage}`, statusCode, error);
    }
  }

  // Create document
  // Use SanityDocumentInput for the input document, and GeneratedSanityDocument for the return type.
  async create(document: SanityDocumentInput): Promise<GeneratedSanityDocument> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot create document: No API token provided');
    }
    try {
      // The create method should now return GeneratedSanityDocument due to typegen overload.
      const result = await this.writeClient.create(document);
      const errorPayload = getErrorPayload(result);
      if (errorPayload?.error) {
        const message = formatErrorMessage(errorPayload.error, 'Create error');
        throw new SanityAPIError(
          `Create failed: ${message}`,
          extractStatusCode(errorPayload),
          errorPayload
        );
      }

      if (typeof result === 'undefined') {
        throw new SanityAPIError('Create failed: Create error');
      }

      if (!result) {
        throw new SanityAPIError('Create operation returned no result');
      }

      if (this.debug) {
        if (result?._id) {
          structuredLogger.info('Sanity document created', {
            component: 'sanity-http',
            id: result._id,
          });
        } else {
          structuredLogger.info('Sanity document created (no _id)', {
            component: 'sanity-http',
          });
        }
      }

      return result;
    } catch (error: unknown) {
      // Catching unknown for better type safety
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const statusCode = extractStatusCode(error);
      throw new SanityAPIError(`Create failed: ${errorMessage}`, statusCode, error);
    }
  }

  // Update document
  async update(id: string, patches: Record<string, unknown>): Promise<GeneratedSanityDocument> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot update document: No API token provided');
    }
    try {
      // The patch method returns a Patch object, which exposes the set() helper.
      const patchObj = this.writeClient.patch(id);
      // The set method accepts a plain record of fields to update.
      const setObj = patchObj.set(patches);

      // Ensure commit is a function before calling
      if (typeof setObj.commit !== 'function') {
        throw new SanityAPIError('Update failed: commit is not a function on the patch object');
      }

      const result = (await setObj.commit()) as GeneratedSanityDocument;

      const errorPayload = getErrorPayload(result);
      if (errorPayload?.error) {
        const message = formatErrorMessage(errorPayload.error, 'Update error');
        throw new SanityAPIError(
          `Update failed: ${message}`,
          extractStatusCode(errorPayload),
          errorPayload
        );
      }

      if (typeof result === 'undefined') {
        throw new SanityAPIError('Update failed: Update error');
      }

      if (!result) {
        throw new SanityAPIError('Update operation returned no result');
      }

      if (this.debug) {
        structuredLogger.info('Sanity document updated', {
          component: 'sanity-http',
          id,
        });
      }
      return result;
    } catch (error: unknown) {
      // Catching unknown for better type safety
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

      // Check if result is undefined (error case)
      if (result === undefined) {
        throw new SanityAPIError('Delete failed: Delete error');
      }

      const errorPayload = getErrorPayload(result);
      if (errorPayload?.error) {
        const message = formatErrorMessage(errorPayload.error, 'Delete error');
        throw new SanityAPIError(
          `Delete failed: ${message}`,
          extractStatusCode(errorPayload),
          errorPayload
        );
      }

      if (this.debug) {
        structuredLogger.info('Sanity document deleted', {
          component: 'sanity-http',
          id,
        });
      }

      return result;
    } catch (error: unknown) {
      // Catching unknown for better type safety
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
      if (!this.writeClient.assets) {
        throw new SanityAPIError('Asset upload failed: Sanity client assets API not available');
      }

      if (typeof this.writeClient.assets.upload !== 'function') {
        throw new SanityAPIError(
          'Asset upload failed: this.writeClient.assets.upload is not a function'
        );
      }

      // Enforce image content type
      const contentType = options?.contentType ?? '';
      if (contentType && !contentType.startsWith('image/')) {
        throw new SanityAPIError(
          'Asset upload failed: Only image/* content types are supported by uploadAsset()'
        );
      }

      let asset: GeneratedSanityAssetDocument | undefined; // Typed as GeneratedSanityAssetDocument
      try {
        // The upload method expects the asset type ('image' or 'file') as the first argument.
        // It returns a SanityAssetDocument. Use the generated type.
        asset = await this.writeClient.assets.upload('image', file, {
          filename: options?.filename,
          contentType: contentType || undefined,
          title: options?.title,
          description: options?.description,
        });
      } catch (error: unknown) {
        // Catching unknown for better type safety
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        const statusCode = extractStatusCode(error);
        throw new SanityAPIError(`Asset upload failed: ${errorMessage}`, statusCode, error);
      }

      // The upload method should return a SanityAssetDocument on success.
      // Check for _id as a sign of success.
      const assetError = getErrorPayload(asset);
      if (assetError?.error) {
        const message = formatErrorMessage(assetError.error, 'Upload error');
        throw new SanityAPIError(
          `Asset upload failed: ${message}`,
          extractStatusCode(assetError),
          assetError
        );
      }

      if (typeof asset === 'undefined') {
        throw new SanityAPIError('Asset upload failed: Upload error');
      }

      if (!asset) {
        throw new SanityAPIError('Upload asset operation returned no result');
      }

      if (!asset._id || !asset._id.toString().trim()) {
        throw new SanityAPIError('Asset upload failed: Invalid asset id');
      }

      if (this.debug) {
        // Debug logging removed for production
      }

      // Convert asset document to a Sanity image field object
      // Use the custom SanityImageObject type.
      const imageObject = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      } as SanityImageObject;
      return imageObject;
    } catch (error: unknown) {
      // Catching unknown for better type safety
      if (error instanceof SanityAPIError) throw error; // Re-throw if it's already our custom error
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const statusCode = extractStatusCode(error);
      throw new SanityAPIError(`Asset upload failed: ${errorMessage}`, statusCode, error);
    }
  }

  // Create many documents
  // Use SanityDocumentInput[] for input and GeneratedSanityDocument[] for output.
  async createMany(documents: SanityDocumentInput[]): Promise<GeneratedSanityDocument[]> {
    if (!process.env.SANITY_API_TOKEN) {
      throw new SanityAPIError('Cannot create documents: No API token provided');
    }
    try {
      const tx = this.writeClient.transaction();
      for (const doc of documents) {
        tx.create(doc);
      }

      let commitResult: unknown;
      try {
        commitResult = await tx.commit({ returnDocuments: true });
      } catch (error: unknown) {
        // Catching unknown for better type safety
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        const statusCode = extractStatusCode(error);
        throw new SanityAPIError(`Batch create failed: ${errorMessage}`, statusCode, error);
      }

      const normalizeDocuments = (items: unknown[]): GeneratedSanityDocument[] =>
        items.filter((item): item is GeneratedSanityDocument => Boolean(item));

      if (Array.isArray(commitResult)) {
        const docs = normalizeDocuments(commitResult);
        if (!docs.length && documents.length > 0) {
          throw new SanityAPIError('Batch create operation returned no documents');
        }
        return docs;
      }

      const asResult = commitResult as {
        results?: { document?: GeneratedSanityDocument }[];
        error?: string;
        statusCode?: number;
      };
      const results = asResult?.results;
      if (!Array.isArray(results)) {
        const errorMsg = asResult?.error || 'Batch create error: Invalid response structure';
        throw new SanityAPIError(
          `Batch create failed: ${errorMsg}`,
          asResult?.statusCode,
          asResult
        );
      }

      const createdDocs = results
        .map(r => r?.document)
        .filter((doc): doc is GeneratedSanityDocument => Boolean(doc));

      if (!createdDocs.length && documents.length > 0) {
        throw new SanityAPIError(
          'Batch create operation returned no documents',
          asResult?.statusCode,
          asResult
        );
      }

      return createdDocs;
    } catch (error: unknown) {
      // Catching unknown for better type safety
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
          return {
            status: 'error',
            details: { error: 'Unknown error' },
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
    } catch (error: unknown) {
      // Catching unknown for better type safety
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
    const instance = getSanityHTTPClient();
    return Reflect.get(instance, prop as keyof SanityHTTPClient);
  },
});

// Export client getter functions for backward compatibility
export const getClient = (preview = false) => {
  // FORTEST: Respect DISABLE_SANITY_DURING_BUILD flag
  const disableSanity = process.env.DISABLE_SANITY_DURING_BUILD === '1' || process.env.DISABLE_SANITY_DURING_BUILD === 'true';
  
  if (disableSanity) {
    // Return stub client
    return {
      fetch: async () => null,
      getDocument: async () => null,
    } as unknown as SanityClient;
  }
  
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

export type { SanityDocumentInput };
// Do not use export default for ESM/CJS compatibility
