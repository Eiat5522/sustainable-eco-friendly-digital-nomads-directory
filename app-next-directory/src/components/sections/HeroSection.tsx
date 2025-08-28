'use client';

import React from 'react';
import { NeoInput } from '@/components/ui/neo-input';
import { NeoButton } from '@/components/ui/neo-button';
import { Search, Mic } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      className="relative min-h-[600px] bg-gradient-to-br from-neo-primary via-blue-600 to-blue-800 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Geometric Shapes */}
      <div
        className="absolute top-20 left-20 w-32 h-32 bg-neo-secondary rounded-full opacity-80"
        aria-hidden="true"
        role="presentation"
      >
        <div className="absolute inset-4 bg-neo-border rounded-full"></div>
        <div className="absolute top-8 left-8 w-4 h-16 bg-neo-border rounded-full"></div>
        <div className="absolute top-8 right-8 w-4 h-16 bg-neo-border rounded-full"></div>
        <div className="absolute top-4 left-12 w-4 h-16 bg-neo-border rounded-full transform rotate-45"></div>
        <div className="absolute top-4 right-12 w-4 h-16 bg-neo-border rounded-full transform -rotate-45"></div>
        <div className="absolute bottom-4 left-12 w-4 h-16 bg-neo-border rounded-full transform -rotate-45"></div>
        <div className="absolute bottom-4 right-12 w-4 h-16 bg-neo-border rounded-full transform rotate-45"></div>
      </div>
      <div className="absolute top-32 right-20 w-24 h-24 bg-pink-400 transform rotate-45">
        <div className="absolute inset-2 bg-neo-border"></div>
      </div>

      {/* Dashed divider */}
      <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-neo-border opacity-60"></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 id="hero-heading" className="heading-xl text-white mb-6">
            A Curated Directory For Sustainable Digital Nomads
          </h1>
          <p className="body-lg text-blue-100 mb-12 max-w-2xl mx-auto">
            The growing source for all sustainable venues is empowered by the
            community to ensure you will get the most eco-friendly spaces for
            your digital nomad journey.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search
                aria-hidden="true"
                focusable="false"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neo-text-secondary"
                size={20}
              />
              <NeoInput
                id="hero-search"
                aria-label="Search venues"
                placeholder="Search 3,200+ sustainable venues"
                className="pl-12 pr-16 h-16 text-lg bg-white"
              />
              <button
                type="button"
                aria-label="Start voice search"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
                title="Voice search coming soon"
              >
                <Mic
                  aria-hidden="true"
                  focusable="false"
                  className="text-neo-text-secondary"
                  size={20}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
