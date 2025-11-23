'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface ModerationItem {
  _id: string;
  type: 'listing' | 'review' | 'blog_post' | 'user';
  title: string;
  content?: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flagReason?: string;
  reportedAt: string;
  reportedBy?: string;
  author?: {
    name: string;
    email: string;
  };
}

interface ModerationResponse {
  items: ModerationItem[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export default function ModerationQueue() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  useEffect(() => {
    if (session?.user?.role === 'admin' || session?.user?.role === 'moderator') {
      fetchModerationQueue();
    }
  }, [session, selectedStatus, selectedType, pagination.page]);

  const fetchModerationQueue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: selectedStatus,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }

      const response = await fetch(`/api/admin/moderation?${params}`);
      if (response.ok) {
        const data: { data: ModerationResponse } = await response.json();
        setItems(data.data.items);
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch moderation queue:', error);
    }
    setLoading(false);
  };

  const handleModerationAction = async (itemId: string, action: 'approve' | 'reject' | 'flag', reason?: string) => {
    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          itemId,
          reason,
        }),
      });

      if (response.ok) {
        fetchModerationQueue(); // Refresh the queue
      }
    } catch (error) {
      console.error('Failed to perform moderation action:', error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'flag') => {
    const selectedItems = items.filter(item => (document.getElementById(`item-${item._id}`) as HTMLInputElement)?.checked);

    if (selectedItems.length === 0) {
      alert('Please select items to moderate');
      return;
    }

    const reason = action === 'reject' || action === 'flag' ? prompt('Please provide a reason:') : undefined;
    if ((action === 'reject' || action === 'flag') && !reason) return;

    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk',
          items: selectedItems.map(item => ({
            itemId: item._id,
            action,
            reason,
          })),
        }),
      });

      if (response.ok) {
        fetchModerationQueue(); // Refresh the queue
      }
    } catch (error) {
      console.error('Failed to perform bulk moderation action:', error);
    }
  };

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    return <div>Access denied. Admin or moderator role required.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Content Moderation</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="listing">Listings</option>
              <option value="review">Reviews</option>
              <option value="blog_post">Blog Posts</option>
              <option value="user">Users</option>
            </select>
          </div>

          <div className="ml-auto">
            <div className="space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Bulk Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Bulk Reject
              </button>
              <button
                onClick={() => handleBulkAction('flag')}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Bulk Flag
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No items found for the selected criteria.
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item._id} className="p-6">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      id={`item-${item._id}`}
                      className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="capitalize">Type: {item.type}</span>
                            <span>Status: <StatusBadge status={item.status} /></span>
                            <span>Reported: {new Date(item.reportedAt).toLocaleDateString()}</span>
                            {item.author && <span>By: {item.author.name}</span>}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleModerationAction(item._id, 'approve')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) handleModerationAction(item._id, 'reject', reason);
                            }}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for flagging:');
                              if (reason) handleModerationAction(item._id, 'flag', reason);
                            }}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                          >
                            Flag
                          </button>
                        </div>
                      </div>

                      {item.content && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <p className="text-gray-700">{item.content.substring(0, 200)}...</p>
                        </div>
                      )}

                      {item.flagReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-red-700 text-sm"><strong>Flag Reason:</strong> {item.flagReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-6 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    flagged: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}
