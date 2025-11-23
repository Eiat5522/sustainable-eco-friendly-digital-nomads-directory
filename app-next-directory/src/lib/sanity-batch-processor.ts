/**
 * Advanced Batch Processing & Validation System
 * Day 1 Sprint: Session 3 - Batch Operations
 * Date: May 24, 2025
 */

import type { SanityDocument } from '@/types/sanity';
import type { SanityDocumentInput } from './sanity-http-client';
import { sanityHTTPClient } from './sanity-http-client';
import { imageUploader } from './sanity-image-uploader';

// Validation schemas
export interface ListingValidationSchema {
  name: string;
  type: string;
  city: string;
  country: string;
  description?: string;
  website?: string;
  images?: File[];
  ecoTags?: string[];
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Batch operation result
export interface BatchProcessResult<TSuccess, TFailure = TSuccess> {
  successful: Array<{ id: string; data: TSuccess }>;
  failed: Array<{ data: TFailure; error: string; index: number }>;
  total: number;
  successCount: number;
  failureCount: number;
  duration: number;
  summary: string;
}

// Progress callback type
export type ProgressCallback = (completed: number, total: number, stage: string) => void;

type SanityDocumentResult = SanityDocument & Record<string, unknown>;

type UpdatePayload = { id: string; data: Record<string, unknown> };

type ProcessedListingPayload = {
  _type: 'listing';
  name: string;
  type: string;
  city: string;
  country: string;
  description?: string;
  website?: string;
  address?: string;
  ecoTags: string[];
  createdAt: string;
  status: string;
  coordinates?: {
    lat: number;
    lng: number;
    _type: 'geopoint';
  };
  images?: Array<{
    _type: 'image';
    asset: {
      _type: 'reference';
      _ref: string;
    };
    alt: string;
  }>;
};

export class SanityBatchProcessor {
  private defaultConcurrency = 5;
  private retryAttempts = 3;
  private retryDelay = 1000;

  /**
   * Batch create listings with validation and image processing
   */
  async createListingsBatch(
    listings: ListingValidationSchema[],
    options: {
      concurrency?: number;
      onProgress?: ProgressCallback;
      validateOnly?: boolean;
      skipImages?: boolean;
    } = {}
  ): Promise<BatchProcessResult<SanityDocumentResult, ListingValidationSchema>> {
    const startTime = Date.now();
    const {
      concurrency = this.defaultConcurrency,
      onProgress,
      validateOnly = false,
      skipImages = false,
    } = options;

    const result: BatchProcessResult<SanityDocumentResult, ListingValidationSchema> = {
      successful: [],
      failed: [],
      total: listings.length,
      successCount: 0,
      failureCount: 0,
      duration: 0,
      summary: '',
    };

    // Step 1: Validation
    onProgress?.(0, listings.length, 'Validating listings');
    const validationResults = await this.validateListings(listings);

    if (validationResults.failed.length > 0) {
      result.failed = validationResults.failed;
      result.failureCount = validationResults.failed.length;
    }

    if (validateOnly) {
      result.duration = Date.now() - startTime;
      result.summary = `Validation complete: ${validationResults.successful.length} valid, ${validationResults.failed.length} invalid`;
      return result;
    }

    const validListings = validationResults.successful.map(v => v.data);

    // Step 2: Process in batches
    for (let i = 0; i < validListings.length; i += concurrency) {
      const batch = validListings.slice(i, i + concurrency);
      const batchPromises = batch.map(async (listing, batchIndex) => {
        const globalIndex = i + batchIndex;

        try {
          onProgress?.(globalIndex, listings.length, 'Processing listing');

          // Process listing with retry logic
          const processedListing = await this.processListingWithRetry(listing, skipImages);

          result.successful.push({
            id: processedListing._id,
            data: processedListing,
          });
          result.successCount++;
        } catch (error) {
          result.failed.push({
            data: listing,
            error: error instanceof Error ? error.message : 'Unknown error',
            index: globalIndex,
          });
          result.failureCount++;
        }
      });

      await Promise.all(batchPromises);

      // Brief pause between batches to avoid rate limiting
      if (i + concurrency < validListings.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    result.duration = Date.now() - startTime;
    result.summary = `Processed ${result.total} listings in ${(result.duration / 1000).toFixed(2)}s: ${result.successCount} successful, ${result.failureCount} failed`;
    return result;
  }

  /**
   * Validate listings array
   */
  private async validateListings(
    listings: ListingValidationSchema[]
  ): Promise<BatchProcessResult<ListingValidationSchema>> {
    const result: BatchProcessResult<ListingValidationSchema> = {
      successful: [],
      failed: [],
      total: listings.length,
      successCount: 0,
      failureCount: 0,
      duration: 0,
      summary: '',
    };

    listings.forEach((listing, index) => {
      try {
        this.validateSingleListing(listing);
        result.successful.push({ id: `temp-${index}`, data: listing });
        result.successCount++;
      } catch (error) {
        result.failed.push({
          data: listing,
          error: error instanceof Error ? error.message : 'Validation failed',
          index,
        });
        result.failureCount++;
      }
    });

    return result;
  }

  /**
   * Validate a single listing
   */
  private validateSingleListing(listing: ListingValidationSchema): void {
    // Required fields
    if (!listing.name || listing.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (
      !listing.type ||
      !['accommodation', 'coworking', 'cafe', 'activity'].includes(listing.type)
    ) {
      throw new Error('Valid type is required (accommodation, coworking, cafe, activity)');
    }

    if (!listing.city || listing.city.trim().length === 0) {
      throw new Error('City is required');
    }

    if (!listing.country || listing.country.trim().length === 0) {
      throw new Error('Country is required');
    }

    // Validate website URL if provided
    if (listing.website) {
      try {
        new URL(listing.website);
      } catch {
        throw new Error('Invalid website URL');
      }
    }

    // Validate coordinates if provided
    if (listing.coordinates) {
      const { lat, lng } = listing.coordinates;
      if (typeof lat !== 'number' || lat < -90 || lat > 90) {
        throw new Error('Invalid latitude');
      }
      if (typeof lng !== 'number' || lng < -180 || lng > 180) {
        throw new Error('Invalid longitude');
      }
    }

    // Validate eco tags
    if (listing.ecoTags && (!Array.isArray(listing.ecoTags) || listing.ecoTags.length > 10)) {
      throw new Error('Eco tags must be an array with max 10 items');
    }

    // Validate images
    if (listing.images && listing.images.length > 20) {
      throw new Error('Maximum 20 images allowed per listing');
    }
  }

  /**
   * Process a single listing with retry logic
   */
  private async processListingWithRetry(
    listing: ListingValidationSchema,
    skipImages = false
  ): Promise<SanityDocumentResult> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.processSingleListing(listing, skipImages);
      } catch (error) {
        if (attempt === this.retryAttempts) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Process a single listing
   */
  private async processSingleListing(
    listing: ListingValidationSchema,
    skipImages = false
  ): Promise<SanityDocumentResult> {
    const payload: ProcessedListingPayload = {
      _type: 'listing',
      name: listing.name.trim(),
      type: listing.type,
      city: listing.city.trim(),
      country: listing.country.trim(),
      description: listing.description?.trim(),
      website: listing.website,
      address: listing.address?.trim(),
      ecoTags: listing.ecoTags || [],
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    // Add coordinates if provided
    if (listing.coordinates) {
      payload.coordinates = {
        lat: listing.coordinates.lat,
        lng: listing.coordinates.lng,
        _type: 'geopoint',
      };
    }

    // Process images if not skipped
    if (!skipImages && listing.images && listing.images.length > 0) {
      const imageResults = await imageUploader.uploadBatch(listing.images, {
        concurrency: 2,
        onProgress: (_completed, _total) => {},
      });

      if (imageResults.successful.length > 0) {
        payload.images = imageResults.successful.map(result => ({
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: result.asset._id,
          },
          alt: `${listing.name} image`,
        }));
      }

      if (imageResults.failed.length > 0) {
      }
    }

    // Create listing in Sanity
    const result = await sanityHTTPClient.create(payload as SanityDocumentInput);

    return result as SanityDocumentResult;
  }

  /**
   * Update existing listings in batch
   */
  async updateListingsBatch(
    updates: Array<UpdatePayload>,
    options: {
      concurrency?: number;
      onProgress?: ProgressCallback;
    } = {}
  ): Promise<BatchProcessResult<SanityDocumentResult, UpdatePayload>> {
    const startTime = Date.now();
    const { concurrency = this.defaultConcurrency, onProgress } = options;

    const result: BatchProcessResult<SanityDocumentResult, UpdatePayload> = {
      successful: [],
      failed: [],
      total: updates.length,
      successCount: 0,
      failureCount: 0,
      duration: 0,
      summary: '',
    };

    // Process updates in batches
    for (let i = 0; i < updates.length; i += concurrency) {
      const batch = updates.slice(i, i + concurrency);
      const batchPromises = batch.map(async (update, batchIndex) => {
        const globalIndex = i + batchIndex;

        try {
          onProgress?.(globalIndex, updates.length, 'Updating listing');

          const updated = await sanityHTTPClient.update(update.id, {
            ...update.data,
            updatedAt: new Date().toISOString(),
          });

          result.successful.push({
            id: update.id,
            data: updated as SanityDocumentResult,
          });
          result.successCount++;
        } catch (error) {
          result.failed.push({
            data: update,
            error: error instanceof Error ? error.message : 'Unknown error',
            index: globalIndex,
          });
          result.failureCount++;
        }
      });

      await Promise.all(batchPromises);
    }

    result.duration = Date.now() - startTime;
    result.summary = `Updated ${result.total} listings in ${(result.duration / 1000).toFixed(2)}s: ${result.successCount} successful, ${result.failureCount} failed`;
    return result;
  }

  /**
   * Delete listings in batch
   */
  async deleteListingsBatch(
    ids: string[],
    options: {
      concurrency?: number;
      onProgress?: ProgressCallback;
    } = {}
  ): Promise<BatchProcessResult<string>> {
    const startTime = Date.now();
    const { concurrency = this.defaultConcurrency, onProgress } = options;

    const result: BatchProcessResult<string> = {
      successful: [],
      failed: [],
      total: ids.length,
      successCount: 0,
      failureCount: 0,
      duration: 0,
      summary: '',
    };

    // Process deletions in batches
    for (let i = 0; i < ids.length; i += concurrency) {
      const batch = ids.slice(i, i + concurrency);
      const batchPromises = batch.map(async (id, batchIndex) => {
        const globalIndex = i + batchIndex;

        try {
          onProgress?.(globalIndex, ids.length, 'Deleting listing');

          await sanityHTTPClient.delete(id);

          result.successful.push({
            id,
            data: id,
          });
          result.successCount++;
        } catch (error) {
          result.failed.push({
            data: id,
            error: error instanceof Error ? error.message : 'Unknown error',
            index: globalIndex,
          });
          result.failureCount++;
        }
      });

      await Promise.all(batchPromises);
    }

    result.duration = Date.now() - startTime;
    result.summary = `Deleted ${result.total} listings in ${(result.duration / 1000).toFixed(2)}s: ${result.successCount} successful, ${result.failureCount} failed`;
    return result;
  }
}

// Export singleton instance
export const batchProcessor = new SanityBatchProcessor();

// Convenience functions
export const createListingsBatch = batchProcessor.createListingsBatch.bind(batchProcessor);
export const updateListingsBatch = batchProcessor.updateListingsBatch.bind(batchProcessor);
export const deleteListingsBatch = batchProcessor.deleteListingsBatch.bind(batchProcessor);

export default batchProcessor;
