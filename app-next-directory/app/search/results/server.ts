import { NextRequest } from 'next/server';
import { z } from 'zod';

import type { ListingSummaryDTO } from '@/types/dto';
import type { SearchParamRecord } from '@/types/search';

import { GET as searchGetHandler } from '../../api/search/route';
import { mapResultToDTO } from './helpers';
import { buildSearchParams, DEFAULT_PAGE_SIZES, getPageNumbers } from './shared';

const searchResponseSchema = z
  .object({
    data: z
      .object({
        results: z.array(z.unknown()).optional(),
        pagination: z
          .object({
            page: z.number().optional(),
            totalPages: z.number().optional(),
            hasMore: z.boolean().optional(),
            limit: z.number().optional(),
            total: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

export type SearchFetchSuccess = {
  ok: true;
  listings: ListingSummaryDTO[];
  pagination: {
    page: number;
    totalPages: number;
    hasMore: boolean;
    limit: number;
    total: number;
  };
  pageSizeOptions: number[];
  pages: (number | '…')[];
};

export type SearchFetchError = {
  ok: false;
  reason: 'response' | 'exception';
  status?: number;
  statusText?: string;
};

export type SearchFetchResult = SearchFetchSuccess | SearchFetchError;

export async function fetchSearchResults(
  searchParams: SearchParamRecord
): Promise<SearchFetchResult> {
  const params = buildSearchParams(searchParams);
  const url = new URL('/api/search', 'http://localhost');
  url.search = params.toString();

  try {
    const request = new NextRequest(url.toString());
    const response = await searchGetHandler(request);

    if (!response.ok) {
      return {
        ok: false,
        reason: 'response',
        status: response.status,
        statusText: response.statusText,
      };
    }

    const payload = await response.json();
    const parsedResponse = searchResponseSchema.safeParse(payload);
    if (!parsedResponse.success) {
    }

    const rawResults =
      parsedResponse.success && Array.isArray(parsedResponse.data.data?.results)
        ? (parsedResponse.data.data?.results ?? [])
        : [];

    let skippedCount = 0;
    const listings = rawResults.reduce<ListingSummaryDTO[]>((accumulator, item) => {
      try {
        accumulator.push(mapResultToDTO(item));
      } catch (_error) {
        skippedCount += 1;
      }
      return accumulator;
    }, []);

    if (skippedCount > 0) {
    }

    const paginationData = parsedResponse.success
      ? (parsedResponse.data.data?.pagination ?? {})
      : {};
    const pageFromResponse = Number(paginationData?.page ?? params.get('page') ?? 1);
    const totalPagesFromResponse = Number(paginationData?.totalPages ?? 1);
    const limitFromResponse = Number(paginationData?.limit ?? params.get('limit') ?? 12);

    const page = Math.max(1, Number.isFinite(pageFromResponse) ? Math.trunc(pageFromResponse) : 1);
    const totalPages = Math.max(
      1,
      Number.isFinite(totalPagesFromResponse) ? Math.trunc(totalPagesFromResponse) : 1
    );
    const limit = Math.max(
      1,
      Number.isFinite(limitFromResponse) ? Math.trunc(limitFromResponse) : 12
    );

    const total = Number.isFinite(paginationData?.total ?? 0)
      ? Number(paginationData?.total ?? 0)
      : listings.length;
    const hasMore = Boolean(paginationData?.hasMore ?? page * limit < total);

    const pageSizeOptions = DEFAULT_PAGE_SIZES.includes(
      limit as (typeof DEFAULT_PAGE_SIZES)[number]
    )
      ? Array.from(DEFAULT_PAGE_SIZES)
      : [limit, ...DEFAULT_PAGE_SIZES].sort((a, b) => a - b);

    const pages = getPageNumbers(page, totalPages);

    return {
      ok: true,
      listings,
      pagination: { page, totalPages, hasMore, limit, total },
      pageSizeOptions,
      pages,
    };
  } catch (_error) {
    return { ok: false, reason: 'exception' };
  }
}
