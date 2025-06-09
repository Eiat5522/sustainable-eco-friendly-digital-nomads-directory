import { useExperiment } from '@/lib/analytics/useExperiment';

interface ListingCtaExperimentProps {
  listingId: string;
}

export function ListingCtaExperiment({ listingId }: ListingCtaExperimentProps) {
  const { variant, isLoading } = useExperiment('listing-cta-experiment');

  if (isLoading || !variant) return null;

  if (!variant) return null;

  switch (variant.id) {
    case 'variant-a':
      return (
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Book Now - Limited Time Offer!
        </button>
      );
    case 'variant-b':
      return (
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full">
          Reserve Your Spot Today
        </button>
      );
    default:
      return (
        <button className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4">
          Book Now
        </button>
      );
  }
}
