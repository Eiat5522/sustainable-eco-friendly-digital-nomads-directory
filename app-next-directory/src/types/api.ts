import type { SanityImage } from './appView';
import type { FeaturedListingDTO } from './dto';

export interface CitiesApiResponse {
  cities: CityDto[];
  success: boolean;
  metadata: {
    total: number;
    query_time: string;
    performance: {
      totalTimeMs: string;
      queryTimeMs: string;
    };
  };
}

export interface CityDto {
  _id: string;
  name: string;
  slug: string;
  country: string;
  sustainabilityScore: number;
  highlights: string[];
  image: SanityImage;
}

export interface FeaturedListingsApiResponse {
  listings: FeaturedListingDTO[];
  success: boolean;
}
