'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface BulkOperationResult {
  success: boolean;
  message: string;
  processed: number;
  errors?: Array<{ item: string; error: string }>;
}

export default function BulkOperations() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'update' | 'delete' | 'export' | 'import'>('export');
  const [selectedType, setSelectedType] = useState<'listings' | 'users' | 'reviews' | 'blog_posts'>('listings');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkOperationResult | null>(null);
  const [exportFields, setExportFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  useEffect(() => {
    // Set available fields based on selected type
    const fieldMap = {
      listings: ['name', 'description', 'category', 'city', 'country', 'ecoRating', 'priceRange', 'amenities', 'status'],
      users: ['name', 'email', 'role', 'createdAt', 'lastLoginAt', 'isActive'],
      reviews: ['title', 'content', 'rating', 'author', 'listing', 'createdAt', 'status'],
      blog_posts: ['title', 'content', 'author', 'category', 'tags', 'status', 'publishedAt']
    };
    setAvailableFields(fieldMap[selectedType]);
    setExportFields(fieldMap[selectedType].slice(0, 5)); // Default selection
  }, [selectedType]);

  const handleExport = async (format: 'json' | 'csv') => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'export',
          type: selectedType,
          format,
          fields: exportFields,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${selectedType}_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);

        setResult({
          success: true,
          message: `${selectedType} exported successfully`,
          processed: 0,
        });
      } else {
        const errorData = await response.json();
        setResult({
          success: false,
          message: errorData.message || 'Export failed',
          processed: 0,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Export failed: ' + (error as Error).message,
        processed: 0,
      });
    }

    setLoading(false);
  };

  const handleBulkUpdate = async (updateData: Record<string, string | number | boolean>) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'update',
          type: selectedType,
          filter: {}, // Could be customized based on UI inputs
          updateData,
        }),
      });

      const data = await response.json();
      setResult(data.data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Bulk update failed: ' + (error as Error).message,
        processed: 0,
      });
    }

    setLoading(false);
  };

  const handleBulkDelete = async (filter: Record<string, string | number | boolean>) => {
    if (!confirm('Are you sure you want to delete these items? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'delete',
          type: selectedType,
          filter,
        }),
      });

      const data = await response.json();
      setResult(data.data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Bulk delete failed: ' + (error as Error).message,
        processed: 0,
      });
    }

    setLoading(false);
  };

  if (!session || session.user.role !== 'admin') {
    return <div>Access denied. Admin role required.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Bulk Operations</h1>

      {/* Content Type Selection */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as 'listings' | 'users' | 'reviews' | 'blog_posts')}
          className="border border-gray-300 rounded-md px-3 py-2 w-48"
        >
          <option value="listings">Listings</option>
          <option value="users">Users</option>
          <option value="reviews">Reviews</option>
          <option value="blog_posts">Blog Posts</option>
        </select>
      </div>

      {/* Operation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {(['export', 'update', 'delete', 'import'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Export {selectedType}</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select fields to export:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableFields.map((field) => (
                    <label key={field} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportFields.includes(field)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportFields([...exportFields, field]);
                          } else {
                            setExportFields(exportFields.filter(f => f !== field));
                          }
                        }}
                        className="rounded text-green-600"
                      />
                      <span className="text-sm capitalize">{field}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handleExport('json')}
                  disabled={loading || exportFields.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={loading || exportFields.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          )}

          {/* Update Tab */}
          {activeTab === 'update' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bulk Update {selectedType}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedType === 'listings' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select className="border border-gray-300 rounded-md px-3 py-2 w-full">
                        <option value="">Don&apos;t change</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select className="border border-gray-300 rounded-md px-3 py-2 w-full">
                        <option value="">Don&apos;t change</option>
                        <option value="accommodation">Accommodation</option>
                        <option value="coworking">Coworking</option>
                        <option value="activity">Activity</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedType === 'users' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select className="border border-gray-300 rounded-md px-3 py-2 w-full">
                        <option value="">Don&apos;t change</option>
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select className="border border-gray-300 rounded-md px-3 py-2 w-full">
                        <option value="">Don&apos;t change</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => handleBulkUpdate({})}
                disabled={loading}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Update Selected Items
              </button>
            </div>
          )}

          {/* Delete Tab */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Bulk Delete {selectedType}</h3>
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-700 text-sm">
                  ⚠️ <strong>Warning:</strong> This action is permanent and cannot be undone.
                  Use with extreme caution.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delete criteria (leave empty to delete all - NOT RECOMMENDED)
                  </label>
                  <textarea
                    placeholder='Example: {"status": "draft", "createdAt": {"$lt": "2023-01-01"}}'
                    className="border border-gray-300 rounded-md px-3 py-2 w-full h-24"
                  />
                </div>

                <button
                  onClick={() => handleBulkDelete({})}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Delete Items (DANGER)
                </button>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Import {selectedType}</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload file (JSON or CSV)
                </label>
                <input
                  type="file"
                  accept=".json,.csv"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conflict Resolution
                </label>
                <select className="border border-gray-300 rounded-md px-3 py-2">
                  <option value="skip">Skip conflicting items</option>
                  <option value="update">Update existing items</option>
                  <option value="error">Stop on conflict</option>
                </select>
              </div>

              <button
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Import Data
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-700">Processing operation...</p>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`mt-6 p-4 rounded border ${
              result.success
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <h4 className="font-semibold">
                {result.success ? '✅ Operation Completed' : '❌ Operation Failed'}
              </h4>
              <p className="mt-1">{result.message}</p>
              {result.processed > 0 && (
                <p className="text-sm mt-1">Processed: {result.processed} items</p>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Errors:</p>
                  <ul className="text-sm list-disc list-inside">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error.item}: {error.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
