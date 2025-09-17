'use client';

import { useState } from 'react';
import { Search, Filter, MoreHorizontal, Eye, EyeOff, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

// Mock data - in a real app this would come from your API
const mockListings = [
  {
    id: '1',
    title: 'Eco Lodge Barcelona',
    location: 'Barcelona, Spain',
    type: 'Accommodation',
    status: 'active',
    featured: true,
    createdAt: '2024-01-15',
    rating: 4.8,
    reviews: 127
  },
  {
    id: '2',
    title: 'Green Coworking Madrid',
    location: 'Madrid, Spain',
    type: 'Coworking',
    status: 'pending',
    featured: false,
    createdAt: '2024-01-14',
    rating: 4.6,
    reviews: 89
  },
  {
    id: '3',
    title: 'Sustainable Cafe Lisboa',
    location: 'Lisbon, Portugal',
    type: 'Cafe',
    status: 'inactive',
    featured: false,
    createdAt: '2024-01-13',
    rating: 4.2,
    reviews: 43
  }
];

export default function ListingsManagementTable() {
  const [listings] = useState(mockListings);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectListing = (listingId: string) => {
    setSelectedListings(prev => 
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleSelectAll = () => {
    const allIds = filteredListings.map(listing => listing.id);
    setSelectedListings(prev => 
      prev.length === allIds.length ? [] : allIds
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'inactive':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Accommodation':
        return 'bg-purple-100 text-purple-700';
      case 'Coworking':
        return 'bg-blue-100 text-blue-700';
      case 'Cafe':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Listings</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add Listing
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Selected Items Info */}
      {selectedListings.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium">
            {selectedListings.length} listing{selectedListings.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedListings.length === filteredListings.length && filteredListings.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Listing</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Rating</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredListings.map((listing) => (
              <tr key={listing.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedListings.includes(listing.id)}
                    onChange={() => handleSelectListing(listing.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {listing.title}
                      {listing.featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{listing.location}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(listing.type)}`}>
                    {listing.type}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                    {listing.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm">
                    <div className="font-medium">⭐ {listing.rating}</div>
                    <div className="text-gray-600">{listing.reviews} reviews</div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {listing.createdAt}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-green-600 hover:bg-green-100 rounded" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-emerald-600 hover:bg-emerald-100 rounded" title="Approve">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-100 rounded" title="Reject">
                      <XCircle className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="More options">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredListings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No listings found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}