import { SanityListing } from '@/types/sanity';
import { Listing, ListingType, PriceRange, EcoTag, City } from '@/types/listing';

export function mapSanityListingToListing(sanity: SanityListing): Listing {
  return {
    _id: sanity._id,
    name: sanity.name,
    description: sanity.description_short || '',
    type: (['coworking', 'cafe', 'accommodation', 'restaurant', 'activities'] as ListingType[]).includes(sanity.category as ListingType)
      ? (sanity.category as ListingType)
      : 'coworking', // Default to 'coworking' if invalid
    slug: typeof sanity.slug === 'string' ? sanity.slug : sanity.slug?.current || '', // Handle cases where `current` is undefined
    ecoTags: sanity.eco_focus_tags?.map((tag) => ({
      _id: tag._id,
      name: tag.name,
      slug: tag.slug?.current || '',
      description: tag.description || '',
      listingCount: tag.listingCount || 0,
    })) || [],
    primaryImage: sanity.primaryImage?.asset
      ? { asset: { _ref: sanity.primaryImage.asset._ref, url: sanity.primaryImage.asset.url || '' } }
      : { asset: { _ref: '', url: '' } },
    price_indication: sanity.price_indication || '', // Map price_indication as a string
    priceRange: (['budget', 'moderate', 'premium'] as PriceRange[]).includes(sanity.priceRange as PriceRange)
      ? (sanity.priceRange as PriceRange)
      : 'budget', // Default to 'budget' if invalid
    city: sanity.city
      ? {
          _id: sanity.city._id,
          name: sanity.city.title,
          // Fix: handle both string and object for slug
          slug: typeof sanity.city.slug === 'string'
            ? sanity.city.slug
            : sanity.city.slug?.current || '',
          listingCount: sanity.city.listingCount || 0,
          country: sanity.city.country || '',
        }
      : { _id: '', name: '', slug: '', listingCount: 0, country: '' },
    address: sanity.addressString || '',
    rating: sanity.rating || 0,
    website: sanity.website || '', // Add mapping if available
    phone: sanity.phone || '', // Add mapping if available
    email: sanity.email || '', // Add mapping if available
    socialLinks: sanity.socialLinks || {}, // Add mapping if available
    createdAt: sanity._createdAt || new Date().toISOString(), // Map `_createdAt` to `createdAt`
    updatedAt: sanity._updatedAt || new Date().toISOString(), // Map `_updatedAt` to `updatedAt`
  };
}