"use client";

import React from 'react';

export function CityCarousel() {
  return (
    <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="heading-lg">Featured Cities</h2>
            <p className="body-lg text-neo-text-secondary">Discover your next eco-friendly destination</p>
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-8" role="list">
            <div role="listitem" className="w-80 flex-none">
              <div className="relative h-56 -m-6 mb-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
