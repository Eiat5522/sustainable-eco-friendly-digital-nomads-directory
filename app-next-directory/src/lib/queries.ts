import { FilterResults, ListingFilters } from '../types/filters';
import { SanityListing } from '../types/sanity';
import { SortOption } from '../types/sort';
import { getClient } from './sanity/client';

export async function getFeaturedListings() {
  const query = `*[_type == "listing" && status == "approved"] {
    _id,
    name,
    descriptionShort,
    category,
    address,
    mainImage {
      asset-> {
        _id,
        url
      }
    },
    "ecoTags": ecoFocusTags[]->name,
    digitalNomadFeatures,
    rating,
    "slug": slug.current,
    city-> {
      name,
      country
    }
  }`;

  const client = getClient();
  return client.fetch(query);
}

// Common field definitions
const listingFields = `
  _id,
  name,
  "slug": slug.current,
  descriptionShort,
  category,
  "city": city->name,
  address,
  mainImage,
  "ecoTags": ecoFocusTags[]->name,
  digitalNomadFeatures,
  rating,
  lastVerifiedDate
`;

const typeFields = {
  coworking: `
    operatingHours,
    pricingPlans,
    specificAmenities
  `,
  cafe: `
    menuHighlights,
    wifiReliability,
    priceIndication
  `,
  accommodation: `
    roomTypes,
    amenities,
    pricePerNight
  `
};

export async function getFilteredListings(
  filters: ListingFilters,
  page = 1,
  limit = 12,
  sort?: SortOption
): Promise<FilterResults<SanityListing>> {
  let query = `*[_type == "listing"`;
  const conditions: string[] = [];
  const params: Record<string, any> = {};

  // Text search
  if (filters.searchQuery) {
    conditions.push('(name match $searchQuery || descriptionShort match $searchQuery)');
    params.searchQuery = `*${filters.searchQuery}*`;
  }

  // Process filter combinations if they exist
  if (filters.combinations && filters.combinations.length > 0) {
    const enabledGroups = filters.combinations.filter(group => group.isEnabled !== false);
    if (enabledGroups.length > 0) {
      const combinationConditions = enabledGroups.map((group, groupIndex) => {
        const groupConditions = group.conditions.map((condition, condIndex) => {
          const paramKey = `${condition.field}_${groupIndex}_${condIndex}`;
          params[paramKey] = condition.value;

          switch (condition.field) {
            case 'category':
              return `category == $${paramKey}`;
            case 'location':
              return `city->name == $${paramKey}`;
            case 'ecoTags':
              return `$${paramKey} in ecoFocusTags[]->name`;
            case 'nomadFeatures':
              return `$${paramKey} in digitalNomadFeatures`;
            case 'minRating':
              return `rating >= $${paramKey}`;
            case 'maxPriceRange':
              return `priceRange.max <= $${paramKey}`;
            default:
              return '';
          }
        }).filter(Boolean);

        // Join conditions within group using group operator (AND/OR)
        return groupConditions.length > 0 ? `(${groupConditions.join(` ${group.operator} `)})` : null;
      }).filter(Boolean);

      // Join groups with global operator or default to AND
      if (combinationConditions.length > 0) {
        const globalOperator = filters.combinationOperator || 'AND';
        conditions.push(`(${combinationConditions.join(` ${globalOperator} `)})`);
      }
    }
  } else {
    // Traditional single-filter handling if no combinations are specified
    if (filters.category) {
      conditions.push('category == $category');
      params.category = filters.category;
    }

    if (filters.location) {
      conditions.push('city->name == $location');
      params.location = filters.location;
    }

    // Process eco tags with OR logic within the tag group
    if (filters.ecoTags && filters.ecoTags.length > 0) {
      const tagConditions = filters.ecoTags.map((tag, index) => {
        const paramKey = `tag_${index}`;
        params[paramKey] = tag;
        return `$${paramKey} in ecoFocusTags[]->name`;
      });
      conditions.push(`(${tagConditions.join(' || ')})`);
    }

    // Process nomad features with OR logic within the feature group
    if (filters.nomadFeatures && filters.nomadFeatures.length > 0) {
      const featureConditions = filters.nomadFeatures.map((feature, index) => {
        const paramKey = `feature_${index}`;
        params[paramKey] = feature;
        return `$${paramKey} in digitalNomadFeatures`;
      });
      conditions.push(`(${featureConditions.join(' || ')})`);
    }

    if (filters.minRating) {
      conditions.push('rating >= $minRating');
      params.minRating = filters.minRating;
    }

    if (filters.maxPriceRange) {
      conditions.push('priceRange.max <= $maxPrice');
      params.maxPrice = filters.maxPriceRange;
    }
  }

  // Add conditions to query if any exist
  if (conditions.length > 0) {
    query += ` && ${conditions.join(' && ')}`;
  }
  query += ']';

  // Add sorting
  if (sort) {
    query += ` | order(${sort.field} ${sort.direction})`;
  } else {
    query += ` | order(name asc)`;
  }

  // Add pagination and fields
  const start = (page - 1) * limit;
  query += ` [${start}...${start + limit}] {
    _id,
    name,
    slug,
    category,
    descriptionShort,
    city->,
    ecoFocusTags[]->,
    digitalNomadFeatures,
    rating,
    address,
    mainImage {
      asset-> {
        _id,
        url
      }
    }
  }`;

  // Execute query
  const client = getClient();
  const results = await client.fetch(query, params);
  const total = await client.fetch(
    query.replace(/\[\$start\.\.\.\$end\].*$/, '').replace('{ ', '').replace(' }', '')
  );

  return {
    data: results,
    total: total.length,
    page,
    totalPages: Math.ceil(total.length / limit)
  };
}