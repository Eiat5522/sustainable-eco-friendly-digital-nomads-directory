import CityPage from '@/components/city/CityPage';
import { fetchCityDetails } from '@/lib/api';
import { Metadata } from 'next';

interface CityPageParams {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CityPageParams): Promise<Metadata> {
  try {
    const city = await fetchCityDetails(params.slug);

    return {
      title: `${city.name} | Eco-Friendly Digital Nomad Destination`,
      description: city.description_short || `Discover sustainable and eco-friendly places to stay and work remotely in ${city.name}.`,
      openGraph: {
        images: [city.images?.[0] || '/images/default-city.jpg'],
      },
    };
  } catch (error) {
    return {
      title: 'City Not Found',
      description: 'The requested city could not be found.',
    };
  }
}

export default function CityPageRoute({ params }: CityPageParams) {
  return <CityPage slug={params.slug} />;
}
