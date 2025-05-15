"use client";

import { HeroSection } from '@/components/HeroSection';

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection 
        title="Sustainable Digital Nomads"
        subtitle="Find eco-friendly spaces for remote work around the world"
      />
      
      <div className="container mx-auto py-12 px-4">
        <h2 className="text-3xl font-semibold text-center mb-8">
          Welcome to the Preview
        </h2>
        <p className="text-lg text-center max-w-2xl mx-auto">
          This is a simple preview page for the Sustainable Digital Nomads directory. 
          We're working on implementing all the features for a full experience!
        </p>
      </div>
    </div>
  );
}
