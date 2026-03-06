'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useCallback, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { ScrollDownArrow } from '@/components/ui/scroll-down-arrow';

export function HeroSection() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [query, router]
  );

  return (
    <section
      className="relative overflow-hidden bg-neo-secondary px-4 py-16 md:py-24"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute -left-8 top-10 h-28 w-28 rotate-12 border-4 border-neo-border bg-neo-primary shadow-[8px_8px_0_0] shadow-neo-shadow" />
      <div className="pointer-events-none absolute right-10 top-16 h-20 w-20 rounded-full border-4 border-neo-border bg-neo-accent shadow-[6px_6px_0_0] shadow-neo-shadow" />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-16 w-16 -translate-x-1/2 rotate-45 border-4 border-neo-border bg-neo-success shadow-[5px_5px_0_0] shadow-neo-shadow" />

      <div className="container relative z-10 mx-auto max-w-6xl">
        <div
          className="mx-auto max-w-4xl border-4 border-neo-border bg-neo-surface p-6 text-center md:p-10"
          style={{ boxShadow: '14px 14px 0px 0px var(--neo-shadow)' }}
        >
          <div className="mb-5 inline-block border-2 border-neo-border bg-neo-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[3px_3px_0_0] shadow-neo-shadow">
            Sustainable Directory
          </div>
          <h1 id="hero-heading" className="heading-xl text-neo-border">
            A Curated Home for Eco-Friendly Digital Nomads
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-neo-text-secondary md:text-base">
            Explore handpicked places to work, stay, and connect while keeping your footprint low.
          </p>

          <form role="search" onSubmit={handleSubmit} className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <Search
                aria-hidden="true"
                focusable="false"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neo-text-secondary"
                size={20}
              />
              <NeoInput
                id="hero-search"
                type="search"
                aria-label="Search venues"
                placeholder="Search cities, venues, and amenities"
                className="h-14 border-4 pl-12 pr-28"
                name="q"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              <NeoButton
                type="submit"
                variant="primary"
                size="md"
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                Search
              </NeoButton>
            </div>
          </form>
        </div>
      </div>

      <ScrollDownArrow />
    </section>
  );
}
