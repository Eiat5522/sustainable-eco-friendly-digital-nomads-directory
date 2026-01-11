'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';

interface DigitalNomadSearchProps {
  placeholder?: string;
  /**
   * Callback invoked when the user submits a search.
   * ⚠️ Performance: Parents should memoize this callback with useCallback
   * to prevent `performSearch` from being redefined on every render.
   */
  onSearch?: (query: string) => void;
}

export function DigitalNomadSearch({
  placeholder = 'Search listings...',
  onSearch,
}: DigitalNomadSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);

  // Sync with URL changes (e.g., back/forward navigation)
  useEffect(() => {
  const urlQuery = searchParams.get('q') ?? '';
  setQuery(urlQuery);
  }, [searchParams]);

  const performSearch = useCallback(
    (q: string) => {
      const trimmedQuery = q.trim();
      // Update query string and notify parent
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (trimmedQuery) params.set('q', trimmedQuery);
      else params.delete('q');
      params.delete('page');
      router.push(`/search?${params.toString()}`);
      onSearch?.(trimmedQuery);
    },
    [router, searchParams, onSearch]
  );

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      performSearch(query);
    },
    [performSearch, query]
  );

  return (
    <form
      onSubmit={onSubmit}
      className="flex gap-3 w-full"
      role="search"
      aria-label="Search listings"
    >
      <NeoInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search query"
        name="q"
      />
      <NeoButton type="submit" variant="primary">
        Search
      </NeoButton>
    </form>
  );
}

export default DigitalNomadSearch;
