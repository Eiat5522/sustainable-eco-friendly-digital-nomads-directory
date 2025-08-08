import FeaturedListingsBase from '@/components/listings/FeaturedListings';
import { AppListingCard } from '@/types/appView';

interface Props { listings: AppListingCard[] }
export default function FeaturedListings(props: Props) {
  return <FeaturedListingsBase listings={props.listings} variant="home" />;
}
