import { Suspense } from 'react'; // Add Suspense import
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import type { SearchParamRecord } from '@/types/search';
import SearchPageContent from './SearchPageContent'; // Import the new component

type SearchPageProps = { searchParams?: Promise<SearchParamRecord> };

// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="p-8 bg-white shadow-md rounded-lg text-center">
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">Loading Search Results...</h1>
            <p className="text-gray-600">Please wait</p>
          </div>
        </div>
      }>
        <SearchPageContent searchParams={resolvedSearchParams} />
      </Suspense>
      <Footer />
    </div>
  );
}
