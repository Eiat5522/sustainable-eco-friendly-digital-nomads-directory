import FeaturedListingsSection from "@/components/sections/FeaturedListingsSection";
import CityCarouselSection from "@/components/sections/CityCarouselSection";
import { AppListingCard, AppCity } from "@/types/appView";

export default function HomePage() {
  const listings: AppListingCard[] = [
    {
      id: "1",
      name: "Eco Coworking Space",
      slug: "eco-coworking-space",
      city: null,
      ecoFocusTags: ["solar"],
      imageUrl: "/images/fallback.png",
    },
  ];

  const cities: AppCity[] = [
    {
      id: "1",
      name: "Green City",
      slug: "green-city",
      country: "Wonderland",
      sustainabilityScore: 90,
      highlights: ["Bike friendly"],
      primaryImage: { asset: { url: "/images/fallback.png" } },
    },
  ];

  return (
    <main>
      <FeaturedListingsSection listings={listings} />
      <CityCarouselSection cities={cities} />
    </main>
  );
}

