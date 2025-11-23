// Search client implementation

import { logError } from '@/lib/error-handler';
import { fetchJsonWithRetry, getDefaultTimeout } from '@/lib/http/request';
import type { Listing } from '@/types/listings';

export async function searchListings(query: string): Promise<Listing[]> {
  try {
    return await fetchJsonWithRetry<Listing[]>(
      '/api/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      },
      { timeoutMs: getDefaultTimeout() }
    );
  } catch (error) {
    logError(error, { scope: 'lib:client', action: 'searchListings', details: { query } });
    return [];
  }
}
