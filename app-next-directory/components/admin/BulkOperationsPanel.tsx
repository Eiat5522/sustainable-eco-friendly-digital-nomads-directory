'use client';

import { useState } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Archive,
  FileSpreadsheet
} from 'lucide-react';

export default function BulkOperationsPanel() {
  const [selectedOperation, setSelectedOperation] = useState('');
  const [selectedCount, setSelectedCount] = useState(0);

  const bulkOperations = [
    {
      id: 'approve',
      label: 'Approve Selected',
      icon: CheckCircle,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Approve multiple listings at once'
    },
    {
      id: 'reject',
      label: 'Reject Selected',
      icon: XCircle,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Reject multiple listings at once'
    },
    {
      id: 'publish',
      label: 'Publish Selected',
      icon: Eye,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Make selected listings visible to users'
    },
    {
      id: 'unpublish',
      label: 'Unpublish Selected',
      icon: EyeOff,
      color: 'bg-gray-600 hover:bg-gray-700',
      description: 'Hide selected listings from users'
    },
    {
      id: 'archive',
      label: 'Archive Selected',
      icon: Archive,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      description: 'Archive selected listings'
    },
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: Trash2,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Permanently delete selected listings'
    }
  ];

  const importExportOperations = [
    {
      id: 'export-csv',
      label: 'Export to CSV',
      icon: FileSpreadsheet,
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Export listings data to CSV'
    },
    {
      id: 'export-selected',
      label: 'Export Selected',
      icon: Download,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      description: 'Export only selected listings'
    },
    {
      id: 'import-csv',
      label: 'Import from CSV',
      icon: Upload,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      description: 'Bulk import listings from CSV'
    }
  ];

  const handleBulkOperation = (operationId: string) => {
    setSelectedOperation(operationId);
    // In a real app, this would trigger the actual bulk operation
    alert(`Performing ${operationId} on ${selectedCount} selected items`);
  };

  return (
    <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bulk Operations</h2>
          <p className="text-gray-600 text-sm">
            Perform actions on multiple listings simultaneously
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {selectedCount} listings selected
        </div>
      </div>

      {/* Selection Info */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <p className="text-blue-800 font-medium">
          💡 Select listings from the table below to enable bulk operations
        </p>
        <p className="text-blue-600 text-sm mt-1">
          Use the checkboxes in the listings table to select items for bulk operations
        </p>
      </div>

      {/* Bulk Content Operations */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Operations</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {bulkOperations.map((operation) => {
            const Icon = operation.icon;
            return (
              <button
                key={operation.id}
                onClick={() => handleBulkOperation(operation.id)}
                disabled={selectedCount === 0}
                className={`group p-3 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${operation.color}`}
                title={operation.description}
              >
                <Icon className="h-5 w-5 mx-auto mb-2" />
                <span className="text-xs font-medium block">{operation.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Import/Export Operations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Import/Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {importExportOperations.map((operation) => {
            const Icon = operation.icon;
            return (
              <button
                key={operation.id}
                onClick={() => handleBulkOperation(operation.id)}
                className={`group flex items-center gap-3 p-4 rounded-lg text-white transition-all ${operation.color}`}
              >
                <Icon className="h-6 w-6" />
                <div className="text-left">
                  <span className="font-medium block">{operation.label}</span>
                  <span className="text-xs opacity-90">{operation.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Operation Status */}
      {selectedOperation && (
        <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
          <p className="text-gray-700">
            <strong>Last Operation:</strong> {selectedOperation} on {selectedCount} items
          </p>
        </div>
      )}
    </div>
  );
}