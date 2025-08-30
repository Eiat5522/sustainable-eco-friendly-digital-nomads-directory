import { CityDetailView } from '@/components/city/CityDetailView';
import { notFound } from 'next/navigation';
import { getCityBySlug, getCityDetailBySlug, getListingsByCityId } from '@/lib/data/city';
import type { CityDTO, CityDetailDTO, ListingSummaryDTO } from '@/types/dto';
import { CityDTOSchema, CityDetailDTOSchema, ListingSummaryDTOArraySchema } from '@/types/dto-schemas';

export const revalidate = 300;

type Props = { params: { slug: string } };

export default async function CityPage({ params }: Props) {
  // Support Next 14 (sync) and Next 15 (async) params
  const { slug } = await Promise.resolve(params as unknown as { slug: string });

  // Try to fetch detailed city data first, fall back to basic data
  let city: CityDTO | CityDetailDTO;
  let rawCity: CityDTO | CityDetailDTO | null = await getCityDetailBySlug(slug);

  if (!rawCity) {
    // Fallback to basic city data
    rawCity = await getCityBySlug(slug);
  }

  if (!rawCity) {
    notFound();
  }

  // Validate based on the type of data we received
  if ('shortDescription' in rawCity && rawCity.shortDescription !== undefined) {
    // This is CityDetailDTO
    const cityResult = CityDetailDTOSchema.safeParse(rawCity);
    if (!cityResult.success) {
      console.error('[city/page] Invalid CityDetailDTO for slug %s:', slug, cityResult.error);
      // Skip listings fetch and render safe defaults
      return <CityDetailView city={{ id: '', name: '', slug, country: '' }} listings={[]} />;
    }
    city = cityResult.data as CityDetailDTO;
  } else {
    // This is basic CityDTO
    const cityResult = CityDTOSchema.safeParse(rawCity);
    if (!cityResult.success) {
      console.error('[city/page] Invalid CityDTO for slug %s:', slug, cityResult.error);
      // Skip listings fetch and render safe defaults
      return <CityDetailView city={{ id: '', name: '', slug, country: '' }} listings={[]} />;
    }
    city = cityResult.data as CityDTO;
  }

  // Only fetch listings when city validation passes
  const rawListings: ListingSummaryDTO[] = await getListingsByCityId(city.id);
  const listingsResult = ListingSummaryDTOArraySchema.safeParse(rawListings);
  if (!listingsResult.success) {
    console.error('[city/page] Invalid ListingSummaryDTO[] for city %s:', city.id, listingsResult.error);
  }
  const listings: ListingSummaryDTO[] = (listingsResult.success ? listingsResult.data : []) as ListingSummaryDTO[];

  return <CityDetailView city={city} listings={listings} />;
}
