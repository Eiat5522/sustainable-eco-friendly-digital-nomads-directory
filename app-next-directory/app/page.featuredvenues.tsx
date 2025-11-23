'use client';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { FeaturedListings } from '@/components/sections/FeaturedListings';

export default function FeaturedVenuesPreview() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="py-8">
          <div className="container mx-auto px-4 text-center mb-8">
            <h1 className="heading-xl mb-4">Featured Venues Preview</h1>
            <p className="body-lg text-neo-text-secondary">
              Preview of the Featured Sustainable Venues section with clickable navigation
            </p>
          </div>
          <FeaturedListings />
        </div>
      </main>
      <Footer />
    </div>
  );
}
