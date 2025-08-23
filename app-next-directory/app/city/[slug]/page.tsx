import CityStats from "@/components/city/CityStats";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { AppCity, AppListingCard } from "@/types/appView";
import type { City as SanityCity } from "@/types/sanity.types";

async function getCityData(slug: string): Promise<{ city: AppCity; listings: AppListingCard[] }> {
  // TODO: Replace with real data fetching logic
  return {
    city: {
      id: slug,
      name: "Sample City",
      slug,
      country: "",
      sustainabilityScore: 0,
      highlights: [],
      description: "",
    },
    listings: [],
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { city, listings } = await getCityData(slug);
  const sanityCity = city as unknown as SanityCity;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{city.name}</h1>
      {city.description && <p className="mb-8">{city.description}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <CityStats city={sanityCity} />
      </div>
      <ListingGrid listings={listings} />
    </div>
  );
}
