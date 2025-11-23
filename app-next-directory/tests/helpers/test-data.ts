import type { TestCity, TestData, TestUser } from '@/tests/helpers/test-data';
import { createTestData } from '@/tests/helpers/test-data';
import type { AppListingCard } from '@/types/appView';

export type PlaywrightTestData = TestData & {
  listingCards: AppListingCard[];
};

const buildListingCards = (data: TestData): AppListingCard[] =>
  data.listings.map(listing => {
    const slug = listing.slug?.current ?? listing._id;
    const city: TestCity | undefined = data.cities.find(
      candidate => candidate.slug === listing.city.slug.current
    );

    return {
      id: listing._id,
      name: listing.name,
      slug,
      city: city
        ? {
            id: city.id,
            name: city.name,
            slug: city.slug,
            country: city.country,
            sustainabilityScore: city.sustainabilityScore,
            highlights: city.highlights,
          }
        : null,
      ecoFocusTags: listing.ecoFocusTags.map(tag => tag.slug.current),
      digitalNomadFeatures: listing.digitalNomadFeatures,
      priceRange: listing.priceRange as AppListingCard['priceRange'],
      website: listing.website ?? undefined,
      imageUrl: listing.primaryImage ? `https://images.test/listings/${slug}.jpg` : undefined,
      primaryImage: listing.primaryImage as AppListingCard['primaryImage'],
      galleryImages: listing.galleryImages as AppListingCard['galleryImages'],
      type: listing.type,
      shortDescription: listing.shortDescription,
      address: listing.address,
      category: listing.category,
      location: listing.location ?? listing.coordinates,
    };
  });

export const getPlaywrightTestData = (overrides?: Partial<TestData>): PlaywrightTestData => {
  const dataset = createTestData(overrides);
  return {
    ...dataset,
    listingCards: buildListingCards(dataset),
  };
};

export const getTestUsers = (): TestUser[] => getPlaywrightTestData().users;

export {
  createTestData,
  getSessionForRole,
  getTestUser,
  listCities,
  listEcoTags,
  mockListings,
  TEST_SESSION_COOKIE_NAME,
} from '@/tests/helpers/test-data';
