import { SearchFilters, SortOption } from '@/types/search';
import { client } from './sanity/client';

interface SearchResults {
  results: any[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Advanced search function with full text search, filters, sorting, and pagination
 */
export async function searchListings(
  query: string,
  filters?: SearchFilters,
  page = 1,
  limit = 12,
  sort?: SortOption,
  preview = false
): Promise<SearchResults> {
  const sanityClient = client;
  const start = (page - 1) * limit;

  // Base query building - only include published listings
  let groqQuery = `*[_type == "listing" && moderation.status == "published"`;
  const params: Record<string, any> = {};

  // Text search across multiple fields with field-specific boosts
  if (query) {
    params.searchText = query;
    groqQuery += ` && (
      boost(name match $searchText, 2.5) ||
      boost(descriptionShort match $searchText, 1.8) ||
      boost(descriptionLong match $searchText, 1.5) ||
      boost(searchMetadata.keywords[]->name match $searchText, 2.0) ||
      boost(category match $searchText, 1.2) ||
      city->name match $searchText ||
      ecoFocusTags[]->name match $searchText ||
      digitalNomadFeatures[]->name match $searchText
    )`;
  }

  // Apply filters
  if (filters) {
    if (filters.category) {
      params.category = filters.category;
      groqQuery += ` && category == $category`;
    }

    if (filters.city) {
      params.city = filters.city;
      groqQuery += ` && city->name == $city`;
    }

    if (filters.ecoTags && filters.ecoTags.length > 0) {
      params.ecoTags = filters.ecoTags;
      groqQuery += ` && count((ecoFocusTags[]->name)[@ in $ecoTags]) > 0`;
    }

    if (filters.hasDigitalNomadFeatures) {
      groqQuery += ` && count(digitalNomadFeatures) > 0`;
    }

    if (filters.minSustainabilityScore) {
      params.minScore = filters.minSustainabilityScore;
      groqQuery += ` && sustainabilityScore >= $minScore`;
    }

    if (filters.maxPriceRange) {
      params.maxPrice = filters.maxPriceRange;
      groqQuery += ` && priceRange.max <= $maxPrice`;
    }
  }

  groqQuery += `] | score(
    boost(name match $searchText, 5) +
    boost(descriptionShort match $searchText, 3) +
    boost(descriptionLong match $searchText, 2) +
    boost(category match $searchText, 2) +
    boost(city->name match $searchText, 2) +
    boost(searchMetadata.keywords[]->name match $searchText, 4)
  )`;

  // Apply sorting
  if (sort) {
    if (sort.field === 'relevance' && query) {
      groqQuery += ' | order(_score desc)';
    } else {
      groqQuery += ` | order(${sort.field} ${sort.direction})`;
    }
  } else if (query) {
    groqQuery += ' | order(_score desc)';
  } else {
    groqQuery += ' | order(name asc)';
  }

  // Project required fields and paginate
  groqQuery += ` {
    _id,
    name,
    "slug": slug.current,
    descriptionShort,
    category,
    "city": city->{
      name,
      "slug": slug.current,
      coordinates
    },
    coordinates,
    mainImage {
      asset->,
      alt
    },
    "ecoTags": ecoFocusTags[]->name,
    "nomadFeatures": digitalNomadFeatures[]->name,
    priceRange,
    rating,
    sustainabilityScore,
    searchMetadata,
    _score
  } [${start}...${start + limit}]`;

  // Execute query
  const results = await sanityClient.fetch(groqQuery, params);

  // Get total count
  const countQuery = groqQuery.replace(/\{[^}]*\} \[\d+\.\.\.\d+\]$/, '').replace('*[', 'count(*[');
  const total = await sanityClient.fetch(countQuery, params);

  return {
    results,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: start + limit < total
    }
  };
}

/**
 * Get autocomplete suggestions for search
 */
export async function getSearchSuggestions(
  query: string,
  limit = 5,
  preview = false
): Promise<string[]> {
  const sanityClient = client;

  const groqQuery = `*[_type == "listing" && moderation.status == "published" && (
    name match $query + "*" ||
    searchMetadata.keywords[]->name match $query + "*"
  )][0...${limit}] {
    name,
    "keywords": searchMetadata.keywords[]->name
  }`;

  const results = await sanityClient.fetch(groqQuery, { query });

  // Extract and flatten unique suggestions
  const suggestions = new Set<string>();
  results.forEach((result: any) => {
    if (result.name.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(result.name);
    }
    if (result.keywords) {
      result.keywords.forEach((keyword: string) => {
        if (keyword.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(keyword);
        }
      });
    }
  });

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Get similar listings based on various factors
 */
export async function getSimilarListings(
  listingId: string,
  limit = 3,
  preview = false
): Promise<any[]> {
  const sanityClient = client;

  const query = `*[_type == "listing" && _id == $listingId][0] {
    "similar": *[_type == "listing" && _id != $listingId && moderation.status == "published"] | score(
      boost(category == ^.category, 3) +
      boost(city._ref == ^.city._ref, 2) +
      count((ecoFocusTags[]->name)[@ in ^.ecoFocusTags[]->name]) +
      count((digitalNomadFeatures[]->name)[@ in ^.digitalNomadFeatures[]->name])
    ) [0...${limit}] {
      _id,
      name,
      "slug": slug.current,
      descriptionShort,
      category,
      "city": city->name,
      mainImage,
      "ecoTags": ecoFocusTags[]->name,
      _score
    }
  }.similar`;

  return sanityClient.fetch(query, { listingId });
}
