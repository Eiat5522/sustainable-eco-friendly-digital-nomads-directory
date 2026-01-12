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

function DigitalNomadSearchForm({
  urlQuery,
  placeholder,
  onSearch,
  searchParams,
}: {
  urlQuery: string;
  placeholder: string;
  onSearch?: (query: string) => void;
  searchParams: ReturnType<typeof useSearchParams>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(urlQuery);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safety net to re-enable the button if navigation doesn't change params
  useEffect(() => {
    if (!isSubmitting) return undefined;

    const timeoutId = window.setTimeout(() => setIsSubmitting(false), 800);
    return () => window.clearTimeout(timeoutId);
  }, [isSubmitting]);

  const performSearch = useCallback(
    (q: string) => {
      const trimmedQuery = q.trim();
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
      if (isSubmitting) return;
      setIsSubmitting(true);
      performSearch(query);
    },
    [performSearch, query, isSubmitting]
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
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search query"
        name="q"
      />
      <NeoButton type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Searching...' : 'Search'}
      </NeoButton>
    </form>
  );
}

export function DigitalNomadSearch({
  placeholder = 'Search listings...',
  onSearch,
}: DigitalNomadSearchProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';

  return (
    <DigitalNomadSearchForm
      key={urlQuery}
      urlQuery={urlQuery}
      placeholder={placeholder}
      onSearch={onSearch}
      searchParams={searchParams}
    />
  );
}

export default DigitalNomadSearch;
