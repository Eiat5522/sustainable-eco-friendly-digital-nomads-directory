import FeaturedListingsBase from '@/components/listings/FeaturedListings';
import type { FeaturedListingDTO } from '@/types/dto'

interface Props { 
  listings: FeaturedListingDTO[] 
}

export default function FeaturedListingsUnified({ listings }: Readonly<Props>) {
  return <FeaturedListingsBase listings={listings} variant="home" />;

}
