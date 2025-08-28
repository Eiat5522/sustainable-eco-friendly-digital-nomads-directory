'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';


type SearchResult = Record<string, unknown>; // TODO: narrow shape when API is wired

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm) return;

    setHasSearched(true);
    setLoading(true);
    try {
      // In a real app, call /api/search?q=${encodeURIComponent(searchTerm)} with AbortController
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResults([]); // Replace with actual search results
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="heading-xl mb-8 text-center">Search for Sustainable Venues</h1>
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <label htmlFor="search-page-input" className="sr-only">Search venues</label>  
            <Search
              aria-hidden="true"
              focusable="false"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neo-text-secondary"
              size={20}
            />
            <NeoInput
              id="search-page-input"
              aria-label="Search venues"
              placeholder="Search by name, city, or amenities"
              className="pl-12 pr-16 h-16 text-lg"
              type="search"
              name="q"
              required
              autoComplete="on"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <NeoButton
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              size="md"
              disabled={loading}
            >
              Search
            </NeoButton>
          </div>
        </form>

        {loading && (
          <p className="text-center" role="status" aria-live="polite">Loading...</p>
        )}
        {!loading && hasSearched && results.length === 0 && (
          <p className="text-center text-neo-text-secondary">
            No results found. Try a different search term.
          </p>
        )}
        {/* Render search results here */}
      </main>
      <Footer />
    </div>
  );
}
