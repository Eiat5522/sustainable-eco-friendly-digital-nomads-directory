import { createClient } from '@sanity/client';
import {
  createWorkdayListingCandidateService,
  type ReferenceResult,
} from '../../../app-next-directory/src/lib/workday-domain/listing-candidates';
import type { ListingCandidate } from '../../../app-next-directory/src/lib/workday-domain/schemas';
import './load-env';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? '';
const token =
  process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_TOKEN ?? process.env.SANITY_TOKEN;

const disableSanity =
  process.env.DISABLE_SANITY_DURING_BUILD === '1' ||
  process.env.DISABLE_SANITY_DURING_BUILD === 'true' ||
  projectId.length === 0 ||
  dataset.length === 0;

const client = disableSanity
  ? null
  : createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      useCdn: false,
      maxRetries: 2,
      ...(token ? { token, ignoreBrowserTokenWarning: true } : {}),
    });

const listingCandidateService = createWorkdayListingCandidateService({
  fetch: async (query, params) => {
    if (!client) return null;
    return client.fetch(query, params);
  },
  logError: (message, error, context) => {
    process.stderr.write(
      `${message} ${JSON.stringify({ context, error: error instanceof Error ? error.message : error })}\n`
    );
  },
  component: 'mcp-apps-server/workday-service',
  messages: {
    fetchCandidatesError: 'Failed to fetch MCP Apps listing candidates',
    searchReferencesError: 'Failed to search MCP Apps listing references',
    fetchCandidateError: 'Failed to fetch MCP Apps listing candidate',
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

export const hasSanityConfiguration = !disableSanity;
