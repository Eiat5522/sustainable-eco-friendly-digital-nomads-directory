'use client';

export function NoListingsFound() {
  return (
    <div className="text-center py-12" role="status" aria-live="polite">
      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center shadow-inner">
        <span aria-hidden="true">🧐</span>
      </div>
      <p className="body-lg">No listings found for this city yet.</p>
      <p className="body-sm text-neo-text-secondary mt-1">
        Try adjusting filters or check back later.
      </p>
    </div>
  );
}
