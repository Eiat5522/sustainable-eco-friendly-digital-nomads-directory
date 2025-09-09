import { CityDetailView } from '@/components/city/CityDetailView';
import { notFound } from 'next/navigation';
import { getCityBySlug, getCityDetailBySlug, getListingsByCityId } from '@/lib/data/city';
import type { CityDTO, CityDetailDTO, ListingSummaryDTO } from '@/types/dto';
import { CityDTOSchema, CityDetailDTOSchema, ListingSummaryDTOArraySchema } from '@/types/dto-schemas';

export const revalidate = 300;

type Params = { slug: string };
type Props = { params: Params | Promise<Params> };

const toTitleCaseFromSlug = (s: string) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const makeFallbackCity = (slug: string): CityDTO => ({
  id: `city-${slug}`,
  name: toTitleCaseFromSlug(slug),
  slug,
  country: 'Unknown',
  highlights: [],
  imageUrl: null,
  imageDimensions: null,
  description: 'Preview data: city details unavailable.',
});

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
    console.error('[city/page] City fetch failed', { slug, err });
  }

  if (!rawCity) {
    // Fallback stub: render a lightweight city page instead of 404 when CMS data is unavailable
    const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const fallbackCity: CityDTO = {
      id: `city-${slug}`,
      name: titleCase(slug),
      slug,
      country: 'Unknown',
      highlights: [],
      imageUrl: null,
      imageDimensions: null,
      description: 'Preview data: city details unavailable.'
    };
    return <CityDetailView city={fallbackCity} listings={[]} />;
  }

  // Validate using schema-first approach (detail → basic)
  const detailResult = CityDetailDTOSchema.safeParse(rawCity);
  if (detailResult.success) {
    city = detailResult.data;
  } else {
    const basicResult = CityDTOSchema.safeParse(rawCity);
    if (basicResult.success) {
      city = basicResult.data;
    } else {
      console.error('[city/page] Invalid city DTO for slug %s:', slug, {
        detail: detailResult.error,
        basic: basicResult.error,
      });
      // Fallback when validation fails: render lightweight city page instead of 404
      return <CityDetailView city={makeFallbackCity(slug)} listings={[]} />;
    }
  }

  // Only fetch listings when city validation passes
  let listings: ListingSummaryDTO[] = [];
  try {
    const rawListings: unknown = await getListingsByCityId(city.id);
    const listingsResult = ListingSummaryDTOArraySchema.safeParse(rawListings);
    if (!listingsResult.success) {
      console.error('[city/page] Invalid ListingSummaryDTO[] for city %s:', city.id, listingsResult.error);
    } else {
      listings = listingsResult.data;
    }
  } catch (e) {
    console.error('[city/page] Listings fetch failed for city %s:', city.id, e);
  }

  return <CityDetailView city={city} listings={listings} />;
}
