'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';
import { Search, MapPin, Building2, Home, Wifi, Shield, Key } from 'lucide-react';
import { FilterMultiSelect, Option } from '@/components/ui/filter-multi-select';
import type {
  City,
  CityResponse,
  CategoryResponse,
  Amenity,
  AmenityResponse,
} from '@/types/api-responses';
type SearchResult = Record<string, unknown>; // TODO: narrow shape when API is wired

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const signal = ctrl.signal;

    async function loadFilters() {
      try {
        const [citiesRes, catsRes, amenitiesRes] = await Promise.all([
          fetch('/api/cities', { signal })
            .then((r) => (r.ok ? (r.json() as Promise<CityResponse>) : Promise.reject(r.statusText)))
            .catch((): CityResponse => ({ cities: [] })),
          fetch('/api/categories', { signal })
            .then((r) => (r.ok ? (r.json() as Promise<CategoryResponse>) : Promise.reject(r.statusText)))
            .catch((): CategoryResponse => ({ categories: [] })),
          fetch('/api/amenities', { signal })
            .then((r) => (r.ok ? (r.json() as Promise<AmenityResponse>) : Promise.reject(r.statusText)))
            .catch((): AmenityResponse => ({ amenities: [] })),
        ]);
        if (cancelled) return;

        const cities = Array.isArray(citiesRes?.cities) ? (citiesRes.cities as City[]) : [];
        const cityOpts: Option[] = Array.from(
          new Map(
            cities
              .filter((c): c is City => typeof c?.name === 'string' && c.name.trim().length > 0)
              .map((c) => {
                const name = c.name.trim();
                // Prefer a stable key if available: const value = String(c.id ?? c.slug ?? name);
                const value = String(c._id ?? c.slug?.current ?? name);
                return [name, { value, label: name, icon: MapPin } as Option] as const;
              })
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));
        setCityOptions(cityOpts);

        const categories: string[] = Array.isArray(catsRes?.categories) ? catsRes.categories : [];
        const typeOpts: Option[] = Array.from(
          new Set(
            categories
              .map((c) => (typeof c === 'string' ? c.trim() : ''))
              .filter(Boolean) as string[]
          )
        )
          .map((cat) => ({
            value: cat,
            label: cat[0].toUpperCase() + cat.slice(1),
            icon: cat.toLowerCase().includes('work') ? Building2 : Home,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setTypeOptions(typeOpts);

        const amenities = Array.isArray(amenitiesRes?.amenities) ? (amenitiesRes.amenities as unknown[]) : [];
        const amenityOpts: Option[] = Array.from(
          new Map(
            amenities
              .filter((a): a is Amenity => typeof a?.name === 'string' && a.name.trim().length > 0)
              .map((a) => {
                const name = a.name.trim();
                const lower = name.toLowerCase();
                const icon =
                  lower.includes('wifi') ? Wifi :
                  lower.includes('security') ? Shield :
                  lower.includes('key') ? Key : Wifi;
                return [name, { value: name, label: name, icon } as Option] as const;
              })
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));
        setAmenityOptions(amenityOpts);
      } catch (e) {
        // Non-fatal; leave options empty
        console.warn('Failed to load filter metadata', e);
      }
    }
    loadFilters();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setHasSearched(true);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.set('q', searchTerm.trim());
      }
      selectedCities.forEach((c) => params.append('destination', c));
      selectedTypes.forEach((t) => params.append('category', t));
      selectedAmenities.forEach((a) => params.append('amenities', a));

      const qs = params.toString();
      const url = qs ? `/api/search?${qs}` : '/api/search';
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = await response.json();
      const results = Array.isArray(data?.data?.results) ? data.data.results : [];
      setResults(results);
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
              placeholder="Search by name, city, or amenities"
              className="pl-12 pr-16 h-16 text-lg"
              type="search"
              name="q"
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
          <div className="mt-4 flex flex-wrap gap-4">
            <FilterMultiSelect
              label="Select cities"
              options={cityOptions}
              selected={selectedCities}
              onChange={setSelectedCities}
              triggerIcon={MapPin}
            />
            <FilterMultiSelect
              label="Select workspace types"
              options={typeOptions}
              selected={selectedTypes}
              onChange={setSelectedTypes}
              triggerIcon={Building2}
            />
            <FilterMultiSelect
              label="Select amenities"
              options={amenityOptions}
              selected={selectedAmenities}
              onChange={setSelectedAmenities}
              triggerIcon={Wifi}
            />
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
