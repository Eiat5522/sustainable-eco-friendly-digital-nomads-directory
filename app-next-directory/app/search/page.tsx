'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    setLoading(true);
    // In a real app, this would make an API call to /api/search?q=${searchTerm}
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResults([]); // Replace with actual search results
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="heading-xl mb-8 text-center">Search for Sustainable Venues</h1>
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <NeoButton
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              size="md"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </NeoButton>
          </div>
        </form>

        <div>
          {loading && <p className="text-center">Loading...</p>}
          {!loading && results.length === 0 && (
            <p className="text-center text-neo-text-secondary">
              No results found. Try a different search term.
            </p>
          )}
          {/* Render search results here */}
        </div>
      </main>
      <Footer />
    </div>
  );
}