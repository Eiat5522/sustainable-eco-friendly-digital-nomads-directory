'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { getUserFacingMessage } from '@/lib/client-utils';
import { fetchJsonWithRetry, getDefaultTimeout, RequestTimeoutError } from '@/lib/http/request';
import type { UserRole } from '@/types/auth';
import {
  isListingTypeValue,
  isListingWorkflowStatus,
  type ListingManagementFilters,
  type ListingManagementItem,
  type ListingManagementPagination,
  type ListingManagementResponse,
  type ListingWorkflowStatus,
} from '@/types/listings';

type ListingsManagementTableProps = {
  currentUserRole?: 'admin' | 'superAdmin';
  currentUserId?: string;
};

type ListingStats = {
  totalListings: number;
  publishedListings: number;
  unpublishedListings: number;
  pendingListings: number;
  draftListings: number;
  featuredListings: number;
  listingsByType: Record<string, number>;
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
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    unpublished: 'bg-gray-50 text-gray-700 border-gray-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    draft: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClasses[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ModerationBadge({ status }: { status: 'pending' | 'approved' | 'rejected' | null }) {
  if (!status) return null;

  const statusClasses = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClasses[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function ListingsManagementTable() {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role;
  const currentUserId = session?.user?.id;
  const [listings, setListings] = useState<ListingManagementItem[]>([]);
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [pagination, setPagination] = useState<ListingManagementPagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState<ListingManagementFilters>({
    search: '',
    status: null,
    type: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionStatus, setActionStatus] = useState<{ listingId: string; message: string } | null>(
    null
  );
  const [statsError, setStatsError] = useState<string | null>(null);

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
    void loadListings(1, '', null, null);
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadListings, loadStats]);

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

      // Reload listings and stats
      await Promise.all([
        loadListings(pagination.page, filters.search, filters.status, filters.type),
        loadStats(),
      ]);

      setTimeout(() => setActionStatus(null), 2000);
    } catch (err) {
      setActionStatus({
        listingId,
        message: getUserFacingMessage(err, 'Failed to update listing'),
      });
      setTimeout(() => setActionStatus(null), 3000);
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

      // Reload listings and stats
      await Promise.all([
        loadListings(pagination.page, filters.search, filters.status, filters.type),
        loadStats(),
      ]);

      setTimeout(() => setActionStatus(null), 2000);
    } catch (err) {
      setActionStatus({
        listingId,
        message: getUserFacingMessage(err, 'Failed to delete listing'),
      });
      setTimeout(() => setActionStatus(null), 3000);
    }
  };

  if (loading && listings.length === 0) {
    return (
      <div className="p-8 text-center" data-testid="listings-loading">
        <output className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </output>
        <p className="mt-4 text-gray-600">Loading listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center" data-testid="listings-error">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() =>
            void loadListings(pagination.page, filters.search, filters.status, filters.type)
          }
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {stats ? (
        <div
          className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          data-testid="listings-stats"
        >
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalListings}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg">
            <p className="text-sm text-emerald-600">Published</p>
            <p className="text-2xl font-bold text-emerald-900">{stats.publishedListings}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-600">Pending</p>
            <p className="text-2xl font-bold text-amber-900">{stats.pendingListings}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Draft</p>
            <p className="text-2xl font-bold text-blue-900">{stats.draftListings}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Unpublished</p>
            <p className="text-2xl font-bold text-gray-900">{stats.unpublishedListings}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600">Featured</p>
            <p className="text-2xl font-bold text-purple-900">{stats.featuredListings}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
          {statsError ?? 'Listing statistics are currently unavailable.'}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search listings..."
          value={filters.search}
          onChange={e => handleSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-testid="search-input"
        />
        <select
          value={filters.status ?? ''}
          onChange={e => handleStatusFilter(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-testid="status-filter"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={filters.type ?? ''}
          onChange={e => handleTypeFilter(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-testid="type-filter"
        >
          <option value="">All Types</option>
          {stats &&
            Object.keys(stats.listingsByType).map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" data-testid="listings-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Listing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Moderation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No listings found
                </td>
              </tr>
            ) : (
              listings.map(listing => (
                <tr key={listing.id} data-testid={`listing-row-${listing.id}`}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                    <div className="text-sm text-gray-500">{listing.slug}</div>
                    {listing.isFeatured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                        ⭐ Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {listing.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.city || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ModerationBadge status={listing.moderationStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeAgo(listing.updatedAt || listing.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {actionStatus?.listingId === listing.id ? (
                      <span className="text-blue-600">{actionStatus.message}</span>
                    ) : (
                      <div className="flex gap-2">
                        {listing.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => void handleListingAction(listing.id, 'publish')}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="Publish"
                          >
                            ✓
                          </button>
                        )}
                        {listing.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => void handleListingAction(listing.id, 'unpublish')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Unpublish"
                          >
                            ⊗
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleListingAction(listing.id, 'suspend')}
                          className="text-amber-600 hover:text-amber-900"
                          title="Suspend"
                        >
                          ⚠
                        </button>
                        {!listing.isFeatured && (
                          <button
                            type="button"
                            onClick={() => void handleListingAction(listing.id, 'feature')}
                            className="text-purple-600 hover:text-purple-900"
                            title="Feature"
                          >
                            ⭐
                          </button>
                        )}
                        {listing.isFeatured && (
                          <button
                            type="button"
                            onClick={() => void handleListingAction(listing.id, 'unfeature')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Unfeature"
                          >
                            ☆
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDeleteListing(listing.id, listing.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          🗑
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
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} listings
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
