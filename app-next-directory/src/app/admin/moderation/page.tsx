import { Suspense } from 'react';
import ModerationQueue from '@/components/admin/ModerationQueue';
import ModerationStats from '@/components/admin/ModerationStats';

export default function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Content Moderation
        </h1>
        <p className="text-gray-600">
          Review and moderate flagged content, listings, and user reports.
        </p>
      </div>

      <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
        <ModerationStats />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
        <ModerationQueue />
      </Suspense>
    </div>
  );
}