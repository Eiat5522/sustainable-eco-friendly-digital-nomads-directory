import ListingDetail from "@/components/listings/ListingDetail";
import { AppListingDetail } from "@/types/appView";

async function getListing(slug: string): Promise<AppListingDetail> {
  // TODO: Replace with real data fetching logic
  return {
    id: slug,
    name: "Sample Listing",
    slug,
    city: null,
    ecoFocusTags: [],
    digitalNomadFeatures: [],
    type: "cafe",
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);

  return <ListingDetail listing={listing} />;
}
