'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, Eye } from 'lucide-react';

// Mock data - in a real app this would come from your API
const mockModerationItems = [
  {
    id: '1',
    type: 'listing',
    title: 'Eco Lodge Barcelona',
    reportedBy: 'user@example.com',
    reason: 'Inappropriate content',
    priority: 'high',
    status: 'pending',
    createdAt: '2024-01-15',
    description: 'User reported misleading sustainability claims'
  },
  {
    id: '2',
    type: 'review',
    title: 'Review for Green Haven Hostel',
    reportedBy: 'another@example.com',
    reason: 'Spam',
    priority: 'medium',
    status: 'pending',
    createdAt: '2024-01-14',
    description: 'Multiple similar reviews from same IP'
  },
  {
    id: '3',
    type: 'user',
    title: 'User: suspicious.user@test.com',
    reportedBy: 'moderator@example.com',
    reason: 'Suspicious activity',
    priority: 'high',
    status: 'under_review',
    createdAt: '2024-01-13',
    description: 'Multiple fake reviews detected'
  }
];

export default function ModerationQueue() {
  const [items] = useState(mockModerationItems);
  const [filter, setFilter] = useState('all');

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'under_review':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'dismissed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'listing':
        return '🏢';
      case 'review':
        return '💬';
      case 'user':
        return '👤';
      default:
        return '📄';
    }
  };

  return (
    <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Moderation Queue</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Items</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getTypeIcon(item.type)}</div>
                <div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Reported by: {item.reportedBy}</span>
                    <span>Reason: {item.reason}</span>
                    <span>Date: {item.createdAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                  {item.priority} priority
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                <Eye className="h-4 w-4" />
                Review
              </button>
              <button className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm">
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button className="flex items-center gap-2 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm">
                <Clock className="h-4 w-4" />
                Defer
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No items in the moderation queue.</p>
        </div>
      )}
    </div>
  );
}