import type { SearchParamRecord } from '@/types/search';

export const DEFAULT_PAGE_SIZES = [12, 24, 48, 96] as const;
export const MAX_PARAM_VALUE_LENGTH = 1000;

export function buildSearchParams(record: SearchParamRecord): URLSearchParams {
  const params = new URLSearchParams();
  const entries = Object.entries(record);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  for (const [key, value] of entries) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach(entry => params.append(key, String(entry)));
    } else {
      params.set(key, String(value));
    }
  }

  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '12');
  params.set('facets', '1');

  return params;
}

export function buildSearchHref(
  basePath: string,
  searchParams: SearchParamRecord,
  overrides: Record<string, string | undefined> = {}
): string {
  const params = new URLSearchParams();
  const entries = Object.entries(searchParams);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  for (const [key, value] of entries) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach(entry => params.append(key, String(entry)));
    } else {
      params.append(key, String(value));
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    params.delete(key);
    if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function getPageNumbers(page: number, totalPages: number): (number | '…')[] {
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedTotalPages = Math.max(1, Math.floor(totalPages));

  if (normalizedTotalPages <= 7) {
    return Array.from({ length: normalizedTotalPages }, (_, index) => index + 1);
  }

  const pages: (number | '…')[] = [];
  pages.push(1);

  if (normalizedPage > 3) {
    pages.push('…');
  }

  const start = Math.max(2, normalizedPage - 1);
  const end = Math.min(normalizedTotalPages - 1, normalizedPage + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (normalizedPage < normalizedTotalPages - 2) {
    pages.push('…');
  }

  pages.push(normalizedTotalPages);
  return pages;
}
