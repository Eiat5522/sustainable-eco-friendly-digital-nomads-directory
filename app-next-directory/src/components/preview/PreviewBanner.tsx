'use client';

import { usePathname } from 'next/navigation';

export function PreviewBanner() {
  const pathname = usePathname();

  async function exitPreview() {
    await fetch('/api/exit-preview');
    window.location.reload();
  }

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-amber-400 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-amber-900 font-medium">
          Preview Mode{' '}
          <span className="text-amber-800 text-sm">
            ({pathname})
          </span>
        </p>
        <button
          onClick={exitPreview}
          className="px-4 py-1 text-sm bg-amber-900 text-white rounded-md hover:bg-amber-800 transition-colors"
        >
          Exit Preview
        </button>
      </div>
    </div>
  );
}
