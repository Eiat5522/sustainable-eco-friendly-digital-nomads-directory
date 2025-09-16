import { CityDetailView } from '@/components/city/CityDetailView';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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

  // Prefer detailed city data; fall back to basic data and guard exceptions
  let rawCity: unknown = null;
  try {
    rawCity = await getCityDetailBySlug(slug);
    if (!rawCity) rawCity = await getCityBySlug(slug);
  } catch (err) {
    console.error('[city/page] City fetch failed', { slug, err });
  }

  if (!rawCity) {
    const fallbackCity = makeFallbackCity(slug);
    return (
      <>
        <Header />
        <main>
          <CityDetailView city={fallbackCity} listings={[]} />
        </main>
        <Footer />
      </>
    );
  }

  // Validate using schema-first approach (detail → basic)
  const detailResult = CityDetailDTOSchema.safeParse(rawCity);
  let city: CityDTO | CityDetailDTO;
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
      return (
        <>
          <Header />
          <main>
            <CityDetailView city={makeFallbackCity(slug)} listings={[]} />
          </main>
          <Footer />
        </>
      );
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
  } catch (err) {
    console.error('[city/page] Listings fetch failed for city %s:', city.id, err);
  }

  return (
    <>
      <Header />
      <main>
        <CityDetailView city={city} listings={listings} />
      </main>
      <Footer />
    </>
  );
}
