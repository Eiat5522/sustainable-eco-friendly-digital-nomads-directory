"use client"

import DigitalNomadSearchFilter from "@/components/ui/DigitalNomadSearchFilter";
import React from "react";

export default function SearchDemoPage() {
  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    console.log("Active filters:", filters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#479b8b]/10 to-[#479b8b]/20 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Digital Nomad Directory
          </h1>
          <p className="text-muted-foreground">
            Discover and filter locations perfect for your remote work lifestyle
          </p>
        </div>

        <DigitalNomadSearchFilter
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
}
