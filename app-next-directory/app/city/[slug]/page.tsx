import { CityDetailView } from '@/components/city/CityDetailView';
import type { CityDTO, ListingSummaryDTO } from '@/types/dto';

interface Props {
  params: { slug: string };
}

async function getCityData(slug: string): Promise<{ city: CityDTO | null; listings: ListingSummaryDTO[] }> {
  try {
    const cityRes = await fetch(`http://localhost:3000/api/city/${slug}`);
    if (!cityRes.ok) {
      return { city: null, listings: [] };
    }
    const city: CityDTO = await cityRes.json();

    const listingsRes = await fetch(`http://localhost:3000/api/listings/city/${city.id}`);
    if (!listingsRes.ok) {
      return { city, listings: [] };
    }
    const listings: ListingSummaryDTO[] = await listingsRes.json();

    return { city, listings };
  } catch (error) {
    console.error('Failed to fetch city data:', error);
    return { city: null, listings: [] };
  }
}

export default async function CityPage({ params }: Props) {
  const { slug } = params;
  const { city, listings } = await getCityData(slug);

  if (!city) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="body-lg text-red-500">City not found</p>
      </div>
    );
  }

  return <CityDetailView city={city} listings={listings} />;
}
