export interface PricingPlan {
  name: string;
  price: number;
  duration: string;
  features: string[];
}

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface EcoTag {
  _id: string;
  name: string;
  slug: { current: string };
  description?: string;
}

export interface Listing {
  _id: string;
  slug?: { current: string };
  name: string;
  city: {
    name: string;
    slug: { current: string };
  };
  type?: 'coworking' | 'cafe' | 'accommodation';
  address: string;
  shortDescription: string;
  longDescription: string;
  ecoTags: EcoTag[];
  ecoDetails: {
    description?: string;
    ecoTags?: string[];
    certifications?: string[];
  };
  sourceUrls: string[];
  mainImage: string;
  galleryImages: string[];
  digitalNomadFeatures: string[];
  lastVerifiedDate: string;
  moderationStatus?: string;
  verificationStatus?: string;
  ecoRating?: number;
  coordinates?: Coordinates;
  coworkingDetails?: {
    operatingHours: string | null;
    pricingPlans: PricingPlan[];
    specificAmenitiesCoworking: string[];
  };
  cafeDetails?: {
    operatingHours: string;
    priceIndication: string;
    menuHighlightsCafe: string[];
    wifiReliabilityNotes: string;
  };
  accommodationDetails?: {
    accommodationType: string;
    pricePerNightThbRange: {
      min: number;
      max: number;
    };
    roomTypesAvailable: string[];
    specificAmenitiesAccommodation: string[];
  };
}
