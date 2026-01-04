'use client';

import type React from 'react';
import { useEffect, useId, useState } from 'react';

interface ListingLongDescriptionProps {
  description: string;
}

export function ListingLongDescription({
  description,
}: ListingLongDescriptionProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionId = useId();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const shouldTruncate = description.trim().length > 260;

  useEffect(() => {
    setStatusMessage('Description loaded. Use Read more to expand.');
  }, []);

  return (
    <div>
      {statusMessage ? (
        <span className="sr-only" role="status" aria-live="polite">
          {statusMessage}
        </span>
      ) : null}
      <div
        id={descriptionId}
        data-testid="long-description"
        data-expanded={isExpanded}
        className={`relative body-md text-neo-text-secondary leading-relaxed transition-[max-height] duration-300 ${
          shouldTruncate && !isExpanded ? 'max-h-32 overflow-hidden pr-1' : 'max-h-none'
        }`}
      >
        <p className="whitespace-pre-line">{description}</p>
        {shouldTruncate && !isExpanded ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-neo-surface via-neo-surface/80 to-transparent"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {shouldTruncate ? (
        <button
          type="button"
          data-testid="read-more-button"
          aria-expanded={isExpanded}
          aria-controls={descriptionId}
          onClick={() => setIsExpanded(prev => !prev)}
          className="mt-3 text-sm font-semibold text-neo-primary hover:text-neo-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary focus-visible:ring-offset-2"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      ) : null}
    </div>
  );
}
