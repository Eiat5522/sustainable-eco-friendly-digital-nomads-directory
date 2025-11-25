import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getAllCitySlugs } from '@/lib/data/city';
import { structuredLogger } from '@/lib/logger';
import { CityDetail } from './CityDetail';

type Params = { slug: string };
type Props = { params: Params | Promise<Params> };

/**
 * Generate static params for all city pages
 * This enables static generation at build time for better performance
 */
export async function generateStaticParams(): Promise<Params[]> {
  try {
    const slugs = await getAllCitySlugs();
    if (slugs.length === 0) {
      return [{ slug: 'no-cities' }];
    }
    return slugs.map(slug => ({ slug }));
  } catch (error) {
    structuredLogger.error('Failed to generate static params for city pages', error, {
      component: 'city-page',
      operation: 'generateStaticParams',
    });
    // Return empty array to allow dynamic rendering as fallback
    return [];
  }
}

export default async function CityPage({ params }: Props) {
  // Next.js 15 requires params to be awaited, but tests may pass a resolved object
  const { slug } = await params;

  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<div className="h-screen rounded-lg bg-muted animate-pulse" role="status" aria-label="Loading city details" aria-busy="true" />}>
          <CityDetail slug={slug} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
