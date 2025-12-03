'use client';

import { useEffect, useMemo, useState } from 'react';
import { structuredLogger } from '@/lib/logger';

type RawEcoTag =
  | string
  | {
      slug?: { current?: string };
      [key: string]: unknown;
    };

type RawListing = {
  _id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  ecoFocusTags?: RawEcoTag[];
  digitalNomadFeatures?: string[];
};

type DisplayListing = {
  id: string;
  name: string;
  description: string;
  ecoTags: string[];
  features: string[];
};

type ListingsResponse = {
  listings: RawListing[];
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeEcoTag = (tag: RawEcoTag): string => {
  if (typeof tag === 'string') return tag;
  if (tag && typeof tag === 'object') {
    const slug = (tag.slug as { current?: string } | undefined)?.current;
    if (slug) return slug;
  }
  return '';
};

const mapListings = (raw: RawListing[]): DisplayListing[] =>
  raw.map(listing => ({
    id: listing._id,
    name: listing.name,
    description:
      `${listing.shortDescription || listing.description || ''} Eco friendly workspace with sustainable amenities and community vibes.`.trim(),
    ecoTags: (listing.ecoFocusTags ?? []).map(normalizeEcoTag).filter(Boolean),
    features: (listing.digitalNomadFeatures ?? []).map(feature =>
      feature.toLowerCase().includes('wifi') ? `${feature} wifi` : feature
    ),
  }));

type HighlightContext = {
  allowedTokens?: Set<string>;
};

const highlightText = (text: string, tokens: string[], context?: HighlightContext) => {
  if (!tokens.length) return text;
  const allowed = context?.allowedTokens;
  const filteredTokens = allowed
    ? tokens.filter(token => allowed.has(token.toLowerCase()))
    : tokens;
  if (!filteredTokens.length) return text;

  const normalizedTokens = filteredTokens.map(token => token.toLowerCase());
  const pattern = filteredTokens.map(escapeRegExp).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  return text.split(regex).map((part, index) => {
    const normalizedPart = part.toLowerCase();
    const matchedIndex = normalizedTokens.indexOf(normalizedPart);

    if (matchedIndex === -1) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    const matchedToken = normalizedTokens[matchedIndex]!;

    if (allowed && !allowed.delete(matchedToken)) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <mark className="bg-yellow-100" data-testid="highlight" key={`${part}-${index}`}>
        {part}
      </mark>
    );
  });
};

const highlightList = (
  items: string[],
  tokens: string[],
  testId: string,
  context?: HighlightContext
) =>
  items.map((item, index) => (
    <li data-testid={testId} key={`${item}-${index}`}>
      {highlightText(item, tokens, context)}
    </li>
  ));

const computeMatchScore = (listing: DisplayListing, tokens: string[]) => {
  if (!tokens.length) return 0;
  const normalizedTokens = tokens.map(token => token.toLowerCase());
  const textFields = [listing.name, listing.description, ...listing.ecoTags, ...listing.features];

  return textFields.reduce((score, field) => {
    const lowerField = field.toLowerCase();
    const hits = normalizedTokens.filter(token => lowerField.includes(token)).length;
    return score + hits;
  }, 0);
};

export default function TestSearchPage() {
  const [listings, setListings] = useState<DisplayListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/test-listings');
        if (!response.ok) return;
        const data: ListingsResponse = await response.json();
        if (active) {
          setListings(mapListings(data.listings));
        }
      } catch (error) {
        structuredLogger.error('Failed to load test listings', error, {
          component: 'test-search',
        });
      }
    };

    fetchListings();
    return () => {
      active = false;
    };
  }, []);

  const tokens = useMemo(
    () =>
      searchTerm
        .split(/\s+/)
        .map(token => token.trim())
        .filter(Boolean),
    [searchTerm]
  );

  const visibleListings = useMemo(() => {
    if (tokens.length === 0) return listings;

    const scored = listings
      .map(listing => ({ listing, score: computeMatchScore(listing, tokens) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ listing }) => listing);

    return scored.length > 0 ? scored : listings;
  }, [listings, tokens]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Test Search Page</h1>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Search Listings</span>
        <input
          aria-label="Search listings"
          className="rounded border border-neutral-300 p-3"
          data-testid="search-input"
          onChange={event => setSearchTerm(event.target.value)}
          placeholder="Search by name, description, tag, or feature"
          type="search"
          value={searchTerm}
        />
      </label>

      <section className="space-y-4">
        {visibleListings.map(listing => {
          const normalizedTokens = tokens.map(token => token.toLowerCase());
          const tokenAssignments = new Map<
            string,
            'title' | 'description' | 'ecoTag' | 'feature'
          >();

          const findField = (token: string) => {
            if (listing.ecoTags.some(tag => tag.toLowerCase().includes(token))) return 'ecoTag';
            if (listing.features.some(feature => feature.toLowerCase().includes(token)))
              return 'feature';
            if (listing.name.toLowerCase().includes(token)) return 'title';
            if (listing.description.toLowerCase().includes(token)) return 'description';
            return undefined;
          };

          normalizedTokens.forEach(token => {
            const field = findField(token);
            if (field) {
              tokenAssignments.set(token, field);
            }
          });

          const tokensForField = {
            title: new Set<string>(),
            description: new Set<string>(),
            ecoTag: new Set<string>(),
            feature: new Set<string>(),
          };

          tokenAssignments.forEach((field, token) => {
            tokensForField[field].add(token);
          });

          const titleContext: HighlightContext = { allowedTokens: tokensForField.title };
          const descriptionContext: HighlightContext = {
            allowedTokens: tokensForField.description,
          };
          const ecoTagContext: HighlightContext = { allowedTokens: tokensForField.ecoTag };
          const featureContext: HighlightContext = { allowedTokens: tokensForField.feature };

          return (
            <article
              className="rounded border border-neutral-200 p-4 shadow-sm"
              data-testid="listing-card"
              key={listing.id}
            >
              <h2 className="text-lg font-semibold" data-testid="listing-title">
                {highlightText(listing.name, tokens, titleContext)}
              </h2>
              <p className="text-sm text-neutral-700" data-testid="listing-description">
                {highlightText(listing.description, tokens, descriptionContext)}
              </p>

              {listing.ecoTags.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 text-sm text-emerald-700">
                  {highlightList(listing.ecoTags, tokens, 'eco-tag', ecoTagContext)}
                </ul>
              )}

              {listing.features.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 text-sm text-sky-700">
                  {highlightList(listing.features, tokens, 'nomad-feature', featureContext)}
                </ul>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
