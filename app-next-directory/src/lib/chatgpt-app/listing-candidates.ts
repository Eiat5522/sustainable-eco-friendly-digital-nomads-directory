import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import {
  createWorkdayListingCandidateService,
  type ReferenceResult,
} from '@/lib/workday-domain/listing-candidates';
import type { ListingCandidate } from '@/lib/workday-domain/schemas';

const listingCandidateService = createWorkdayListingCandidateService({
  fetch: (query, params) => client.fetch(query, params),
  logError: (message, error, context) => structuredLogger.error(message, error, context),
  component: 'chatgpt-app/listing-candidates',
  messages: {
    fetchCandidatesError: 'Failed to fetch ChatGPT listing candidates',
    searchReferencesError: 'Failed to search ChatGPT listing references',
    fetchCandidateError: 'Failed to fetch ChatGPT listing candidate',
  },
});

export const fetchListingCandidates: ({
  city,
  limit,
}: {
  city: string;
  limit?: number;
}) => Promise<ListingCandidate[]> = listingCandidateService.fetchListingCandidates;

export const searchListingReferences: (query: string) => Promise<ReferenceResult[]> =
  listingCandidateService.searchListingReferences;

export const fetchListingCandidate: (identifier: string) => Promise<ListingCandidate | null> =
  listingCandidateService.fetchListingCandidate;
