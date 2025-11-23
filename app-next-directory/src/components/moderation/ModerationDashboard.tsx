'use client';

import type { ModerationStatus, Report } from '@/types/moderation';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    Filter,
    MessageSquare,
    RefreshCw,
    XCircle
} from 'lucide-react';
import { useState } from 'react';

interface ModerationDashboardProps {
  reports: Report[];
  onUpdateStatus: (reportId: string, status: ModerationStatus) => Promise<void>;
  onAddNote: (reportId: string, note: string) => Promise<void>;
}

export default function ModerationDashboard({
  reports,
  onUpdateStatus,
  onAddNote,
}: ModerationDashboardProps) {
  const [filter, setFilter] = useState<ModerationStatus | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredReports = reports.filter(
    report => filter === 'all' || report.status === filter
  );

  const handleStatusUpdate = async (reportId: string, status: ModerationStatus) => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(reportId, status);
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedReport || !note) return;

    setIsProcessing(true);
    try {
      await onAddNote(selectedReport.id, note);
      setNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Content Moderation Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review and manage reported content
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Filter className="h-4 w-4" />
            <span>Filter by status:</span>
          </div>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filter === status
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reports List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reports ({filteredReports.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report) => (
                <motion.button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    selectedReport?.id === report.id
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : ''
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {report.reason.replace(/_/g, ' ')}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {report.description}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Report Details */}
          {selectedReport && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Report Details
                </h2>
              </div>
              <div className="p-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Reason
                    </dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {selectedReport.reason.replace(/_/g, ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Description
                    </dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {selectedReport.description}
                    </dd>
                  </div>
                  {selectedReport.evidence && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Evidence
                      </dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">
                        {selectedReport.evidence}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Add Note */}
                <div className="mt-6">
                  <label
                    htmlFor="note"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Add a note
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="shadow-sm block w-full border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      placeholder="Add your moderation notes here..."
                    />
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={!note || isProcessing}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Note
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center gap-4">
                  <button
                    onClick={() => handleStatusUpdate(selectedReport.id, 'approved')}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedReport.id, 'rejected')}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ModerationStatus }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  };

  const icons = {
    pending: RefreshCw,
    approved: CheckCircle,
    rejected: XCircle,
  };

  const Icon = icons[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
