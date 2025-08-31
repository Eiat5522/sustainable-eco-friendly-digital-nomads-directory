import { CityDetailView } from '@/components/city/CityDetailView';
import { notFound } from 'next/navigation';
import { getCityBySlug, getCityDetailBySlug, getListingsByCityId } from '@/lib/data/city';
import type { CityDTO, CityDetailDTO, ListingSummaryDTO } from '@/types/dto';
import { CityDTOSchema, CityDetailDTOSchema, ListingSummaryDTOArraySchema } from '@/types/dto-schemas';

export const revalidate = 300;

type Params = { slug: string };
type Props = { params: Params | Promise<Params> };

export default async function CityPage({ params }: Props) {
  // Support Next 14 (value) and Next 15 (promise) params
  const { slug } = await Promise.resolve(params);

  // Try to fetch detailed city data first, fall back to basic data; guard exceptions
  let city: CityDTO | CityDetailDTO;
  let rawCity: unknown = null;
  try {
    rawCity = await getCityDetailBySlug(slug);
    if (!rawCity) rawCity = await getCityBySlug(slug);
  } catch (err) {
    console.error('[city/page] City fetch failed for slug %s:', slug, err);
  }

  if (!rawCity) {
    notFound();
  }

  // Validate using schema-first approach (detail → basic)
  const detailResult = CityDetailDTOSchema.safeParse(rawCity);
  if (detailResult.success) {
    city = detailResult.data as CityDetailDTO;
  } else {
    const basicResult = CityDTOSchema.safeParse(rawCity);
    if (basicResult.success) {
      city = basicResult.data as CityDTO;
    } else {
      console.error('[city/page] Invalid city DTO for slug %s:', slug, {
        detail: detailResult.error,
        basic: basicResult.error,
      });
      notFound();
    }
  }

  // Only fetch listings when city validation passes
  const rawListings: unknown = await getListingsByCityId(city.id);
  const listingsResult = ListingSummaryDTOArraySchema.safeParse(rawListings);
  if (!listingsResult.success) {
    console.error('[city/page] Invalid ListingSummaryDTO[] for city %s:', city.id, listingsResult.error);
  }
  const listings: ListingSummaryDTO[] = (listingsResult.success ? listingsResult.data : []) as ListingSummaryDTO[];

  return <CityDetailView city={city} listings={listings} />;
}
