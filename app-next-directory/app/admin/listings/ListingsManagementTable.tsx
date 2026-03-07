'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { getUserFacingMessage } from '@/lib/client-utils';
import { fetchJsonWithRetry, getDefaultTimeout, RequestTimeoutError } from '@/lib/http/request';
import {
  isListingTypeValue,
  isListingWorkflowStatus,
  type ListingManagementFilters,
  type ListingManagementItem,
  type ListingManagementPagination,
  type ListingManagementResponse,
  type ListingWorkflowStatus,
} from '@/types/listings';
import { EditListingModal } from './EditListingModal';
import type { ListingStats } from './types';

type ListingsManagementTableProps = {
  initialData?: ListingManagementResponse;
  initialStats?: ListingStats;
};

async function fetchListings(
  page: number,
  search: string,
  statusFilter: ListingWorkflowStatus | null,
  typeFilter: ListingManagementItem['type'] | null
): Promise<ListingManagementResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
  });

  if (search) params.append('search', search);
  if (statusFilter) params.append('status', statusFilter);
  if (typeFilter) params.append('type', typeFilter);

  return fetchJsonWithRetry<ListingManagementResponse>(`/api/admin/listings?${params}`, undefined, {
    timeoutMs: getDefaultTimeout(),
    retries: 2,
  });
}

async function fetchListingStats(): Promise<ListingStats> {
  return fetchJsonWithRetry<ListingStats>('/api/admin/listings/stats', undefined, {
    timeoutMs: getDefaultTimeout(),
    retries: 2,
  });
}

async function updateListing(
  listingId: string,
  action: 'suspend' | 'publish' | 'unpublish' | 'feature' | 'unfeature'
) {
  return fetchJsonWithRetry<{ message: string }>(
    '/api/admin/listings',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listingId, action }),
    },
    {
      timeoutMs: getDefaultTimeout(),
      retries: 2,
    }
  );
}

async function deleteListing(listingId: string) {
  return fetchJsonWithRetry<{ message: string }>(
    '/api/admin/listings',
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listingId }),
    },
    {
      timeoutMs: getDefaultTimeout(),
      retries: 2,
    }
  );
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours <= 0) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
}

function StatusBadge({ status }: { status: 'published' | 'unpublished' | 'pending' | 'draft' }) {
  const statusClasses = {
    published: 'bg-emerald-100 text-emerald-900',
    unpublished: 'bg-slate-200 text-slate-800',
    pending: 'bg-amber-100 text-amber-900',
    draft: 'bg-sky-100 text-sky-900',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-neo-border px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ModerationBadge({ status }: { status: 'pending' | 'approved' | 'rejected' | null }) {
  if (!status) return <span className="text-xs text-neo-text-tertiary">N/A</span>;

  const statusClasses = {
    pending: 'bg-amber-100 text-amber-900',
    approved: 'bg-emerald-100 text-emerald-900',
    rejected: 'bg-rose-100 text-rose-900',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-neo-border px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function ListingsManagementTable({
  initialData,
  initialStats,
}: ListingsManagementTableProps) {
  const [listings, setListings] = useState<ListingManagementItem[]>(initialData?.listings ?? []);
  const [stats, setStats] = useState<ListingStats | null>(initialStats ?? null);
  const [pagination, setPagination] = useState<ListingManagementPagination>(
    initialData?.pagination ?? {
      page: 1,
      limit: 20,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    }
  );
  const [filters, setFilters] = useState<ListingManagementFilters>(
    initialData?.filters ?? {
      search: '',
      status: null,
      type: null,
    }
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionStatus, setActionStatus] = useState<{ listingId: string; message: string } | null>(
    null
  );
  const [statsError, setStatsError] = useState<string | null>(null);
  const actionStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleActionStatusClear = useCallback((delayMs: number) => {
    if (actionStatusTimeoutRef.current) {
      clearTimeout(actionStatusTimeoutRef.current);
    }
    actionStatusTimeoutRef.current = setTimeout(() => setActionStatus(null), delayMs);
  }, []);

  const loadListings = useCallback(
    async (
      page: number,
      search: string,
      status: ListingWorkflowStatus | null,
      type: ListingManagementItem['type'] | null
    ) => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchListings(page, search, status, type);
        setListings(data.listings);
        setPagination(data.pagination);
        setFilters(prev => ({
          search: prev.search === search ? data.filters.search : prev.search,
          status: data.filters.status,
          type: data.filters.type,
        }));
      } catch (err) {
        const timeoutMessage =
          err instanceof RequestTimeoutError
            ? 'Loading listings is taking longer than expected. Please try again.'
            : undefined;
        setError(timeoutMessage ?? getUserFacingMessage(err, 'Failed to load listings'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadStats = useCallback(async () => {
    try {
      const statsData = await fetchListingStats();
      setStats(statsData);
      setStatsError(null);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load listing statistics');
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      void loadListings(1, '', null, null);
    }
    if (!initialStats) {
      void loadStats();
    }
  }, [initialData, initialStats, loadListings, loadStats]);

  useEffect(() => {
    return () => {
      if (actionStatusTimeoutRef.current) {
        clearTimeout(actionStatusTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = (searchValue: string) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
    startTransition(() => {
      void loadListings(1, searchValue, filters.status, filters.type);
    });
  };

  const handleStatusFilter = (status: string | null) => {
    const normalizedStatus = status && isListingWorkflowStatus(status) ? status : null;
    setFilters(prev => ({ ...prev, status: normalizedStatus }));
    startTransition(() => {
      void loadListings(1, filters.search, normalizedStatus, filters.type);
    });
  };

  const handleTypeFilter = (type: string | null) => {
    const normalizedType = type && isListingTypeValue(type) ? type : null;
    setFilters(prev => ({ ...prev, type: normalizedType }));
    startTransition(() => {
      void loadListings(1, filters.search, filters.status, normalizedType);
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      void loadListings(newPage, filters.search, filters.status, filters.type);
    });
  };

  const handleListingAction = async (
    listingId: string,
    action: 'suspend' | 'publish' | 'unpublish' | 'feature' | 'unfeature'
  ) => {
    try {
      setActionStatus({ listingId, message: 'Processing...' });
      await updateListing(listingId, action);
      setActionStatus({ listingId, message: 'Success!' });

      await Promise.all([
        loadListings(pagination.page, filters.search, filters.status, filters.type),
        loadStats(),
      ]);
      scheduleActionStatusClear(2000);
    } catch (err) {
      setActionStatus({
        listingId,
        message: getUserFacingMessage(err, 'Failed to update listing'),
      });
      scheduleActionStatusClear(3000);
    }
  };

  const handleDeleteListing = async (listingId: string, listingName: string) => {
    if (
      !confirm(`Are you sure you want to delete "${listingName}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      setActionStatus({ listingId, message: 'Deleting...' });
      await deleteListing(listingId);
      setActionStatus({ listingId, message: 'Deleted!' });

      await Promise.all([
        loadListings(pagination.page, filters.search, filters.status, filters.type),
        loadStats(),
      ]);
      scheduleActionStatusClear(2000);
    } catch (err) {
      setActionStatus({
        listingId,
        message: getUserFacingMessage(err, 'Failed to delete listing'),
      });
      scheduleActionStatusClear(3000);
    }
  };

  if (loading && listings.length === 0) {
    return (
      <div className="rounded-2xl border-4 border-neo-border bg-neo-surface/80 p-8 text-center" data-testid="listings-loading">
        <output className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </output>
        <p className="mt-4 text-neo-text-secondary">Loading listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border-4 border-rose-200 bg-rose-50 p-8 text-center" data-testid="listings-error">
        <p className="text-rose-700">{error}</p>
        <NeoButton
          type="button"
          onClick={() =>
            void loadListings(pagination.page, filters.search, filters.status, filters.type)
          }
          className="mt-4"
        >
          Retry
        </NeoButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="heading-sm text-neo-text-primary">Listings</h3>
          <p className="text-sm text-neo-text-secondary">Create and edit listings managed by the team.</p>
        </div>
        <NeoButton asChild>
          <Link href="/admin/listings/new">Add new listing</Link>
        </NeoButton>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6" data-testid="listings-stats">
          <div className="rounded-2xl border-4 border-neo-border bg-white p-4 shadow-[6px_6px_0px_0px_var(--color-neo-shadow)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-neo-text-secondary">Total</p>
            <p className="mt-2 text-2xl font-bold text-neo-text-primary">{stats.totalListings}</p>
          </div>
          <div className="rounded-2xl border-4 border-neo-border bg-emerald-50 p-4 shadow-[6px_6px_0px_0px_var(--color-neo-shadow)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Published</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.publishedListings}</p>
          </div>
          <div className="rounded-2xl border-4 border-neo-border bg-amber-50 p-4 shadow-[6px_6px_0px_0px_var(--color-neo-shadow)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{stats.pendingListings}</p>
          </div>
          <div className="rounded-2xl border-4 border-neo-border bg-sky-50 p-4 shadow-[6px_6px_0px_0px_var(--color-neo-shadow)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Draft</p>
            <p className="mt-2 text-2xl font-bold text-sky-900">{stats.draftListings}</p>
          </div>
          <div className="rounded-2xl border-4 border-neo-border bg-slate-100 p-4 shadow-[6px_6px_0px_0px_var(--color-neo-shadow)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Unpublished</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.unpublishedListings}</p>
          </div>
          <div className="rounded-2xl border-4 border-neo-border bg-fuchsia-100 p-4 shadow-[6px_6px_0px_0px_var(--color-neo-shadow)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">Featured</p>
            <p className="mt-2 text-2xl font-bold text-fuchsia-900">{stats.featuredListings}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-4 border-dashed border-neo-border bg-neo-surface/70 p-6 text-center text-sm text-neo-text-secondary">
          {statsError ?? 'Listing statistics are currently unavailable.'}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <NeoInput
          type="text"
          placeholder="Search listings..."
          value={filters.search}
          onChange={e => handleSearch(e.target.value)}
          className="flex-1"
          data-testid="search-input"
        />
        <select
          value={filters.status != null ? filters.status : ''}
          onChange={e => handleStatusFilter(e.target.value || null)}
          className="h-12 rounded-lg border-2 border-neo-border bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
          data-testid="status-filter"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={filters.type != null ? filters.type : ''}
          onChange={e => handleTypeFilter(e.target.value || null)}
          className="h-12 rounded-lg border-2 border-neo-border bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
          data-testid="type-filter"
        >
          <option value="">All Types</option>
          {stats ? (
            Object.keys(stats.listingsByType).map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))
          ) : (
            <option value="loading" disabled>
              Loading types...
            </option>
          )}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border-4 border-neo-border bg-white shadow-[10px_10px_0px_0px_var(--color-neo-shadow)]">
        <table className="min-w-full divide-y-2 divide-neo-border/60" data-testid="listings-table">
          <thead className="bg-neo-surface/80 text-left text-xs uppercase tracking-wide text-neo-text-secondary">
            <tr>
              <th className="px-6 py-3">Listing</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">City</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Moderation</th>
              <th className="px-6 py-3">Updated</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neo-border/30 bg-white/95 text-sm">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-neo-text-secondary">
                  No listings found
                </td>
              </tr>
            ) : (
              listings.map(listing => (
                <tr key={listing.id} data-testid={`listing-row-${listing.id}`}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-neo-text-primary">{listing.name}</div>
                    <div className="text-xs text-neo-text-secondary">{listing.slug}</div>
                    {listing.isFeatured && (
                      <span className="mt-2 inline-flex items-center rounded-full border-2 border-neo-border bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-900">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 capitalize text-neo-text-primary">{listing.type}</td>
                  <td className="px-6 py-4 text-neo-text-secondary">{listing.city || '-'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-6 py-4">
                    <ModerationBadge status={listing.moderationStatus} />
                  </td>
                  <td className="px-6 py-4 text-neo-text-secondary">
                    {formatTimeAgo(listing.updatedAt || listing.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    {actionStatus?.listingId === listing.id ? (
                      <span className="text-sm font-semibold text-neo-primary">{actionStatus.message}</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <EditListingModal
                          listingId={listing.id}
                          listingName={listing.name}
                          onUpdated={() =>
                            void Promise.all([
                              loadListings(pagination.page, filters.search, filters.status, filters.type),
                              loadStats(),
                            ])
                          }
                        />
                        {listing.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => void handleListingAction(listing.id, 'publish')}
                            className="rounded-md border-2 border-neo-border bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900"
                            title="Publish"
                          >
                            Publish
                          </button>
                        )}
                        {listing.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => void handleListingAction(listing.id, 'unpublish')}
                            className="rounded-md border-2 border-neo-border bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-900"
                            title="Unpublish"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleListingAction(listing.id, 'suspend')}
                          className="rounded-md border-2 border-neo-border bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900"
                          title="Suspend"
                        >
                          Suspend
                        </button>
                        {!listing.isFeatured && (
                          <button
                            type="button"
                            onClick={() => void handleListingAction(listing.id, 'feature')}
                            className="rounded-md border-2 border-neo-border bg-fuchsia-100 px-2 py-1 text-xs font-semibold text-fuchsia-900"
                            title="Feature"
                          >
                            Feature
                          </button>
                        )}
                        {listing.isFeatured && (
                          <button
                            type="button"
                            onClick={() => void handleListingAction(listing.id, 'unfeature')}
                            className="rounded-md border-2 border-neo-border bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-900"
                            title="Unfeature"
                          >
                            Unfeature
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDeleteListing(listing.id, listing.name)}
                          className="rounded-md border-2 border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                          title="Delete"
                          data-testid="delete-listing-button"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border-4 border-neo-border bg-white/90 px-4 py-3 shadow-[8px_8px_0px_0px_var(--color-neo-shadow)] sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neo-text-secondary">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} listings
          </div>
          <div className="flex items-center gap-2">
            <NeoButton
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || isPending}
              size="sm"
              variant="outline"
              aria-label="Previous"
            >
              Previous
            </NeoButton>
            <span className="px-2 text-sm font-semibold text-neo-text-primary">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <NeoButton
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || isPending}
              size="sm"
              variant="outline"
              aria-label="Next"
            >
              Next
            </NeoButton>
          </div>
        </div>
      )}
    </div>
  );
}
