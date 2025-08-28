import { CityDetailView } from '@/components/city/CityDetailView';
import { notFound } from 'next/navigation';
import { getCityBySlug, getListingsByCityId } from '@/lib/data/city';
import type { CityDTO, ListingSummaryDTO } from '@/types/dto';
import { CityDTOSchema, ListingSummaryDTOArraySchema } from '@/types/dto-schemas';

export const revalidate = 300;

type Props = { params: { slug: string } };

export default async function CityPage({ params }: Props) {
  const { slug } = params;

  // Fetch city data via shared data layer; validate at runtime
  const rawCity: CityDTO | null = await getCityBySlug(slug);
  if (!rawCity) {
    notFound();
  }

  const cityResult = CityDTOSchema.safeParse(rawCity);
  if (!cityResult.success) {
    console.error('[city/page] Invalid CityDTO for slug %s:', slug, cityResult.error);
    // Skip listings fetch and render safe defaults
    return <CityDetailView city={{ id: '', name: '', slug, country: '' }} listings={[]} />;
  }
  const city: CityDTO = cityResult.data as CityDTO;

  // Only fetch listings when city validation passes
  const rawListings: ListingSummaryDTO[] = await getListingsByCityId(city.id);
  const listingsResult = ListingSummaryDTOArraySchema.safeParse(rawListings);
  if (!listingsResult.success) {
    console.error('[city/page] Invalid ListingSummaryDTO[] for city %s:', city.id, listingsResult.error);
  }
  const listings: ListingSummaryDTO[] = (listingsResult.success ? listingsResult.data : []) as ListingSummaryDTO[];

  return <CityDetailView city={city} listings={listings} />;
}
