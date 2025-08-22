import Link from "next/link";
import SanityImage from "@/components/SanityImage";
import { AppCity } from "@/types/appView";

interface CityCarouselSectionProps {
  cities: AppCity[];
}

export default function CityCarouselSection({ cities }: CityCarouselSectionProps) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold mb-8">Explore Cities</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/city/${city.slug}`}
              className="w-64 flex-shrink-0"
            >
              <div className="relative h-40 w-full">
                <SanityImage
                  image={city.primaryImage}
                  alt={city.name}
                  fill
                  className="object-cover rounded"
                  sizes="256px"
                />
              </div>
              <p className="mt-2 text-center font-medium">{city.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

