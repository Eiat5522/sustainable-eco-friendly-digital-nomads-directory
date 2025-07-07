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

export interface Listing {
  id: string;
  slug?: string;
  name: string;
  city: string;
  category?: 'coworking' | 'cafe' | 'accommodation';
  address_string: string;
  description_short: string;
  description_long: string;
  eco_focus_tags: string[];
  eco_notes_detailed: string;
  source_urls: string[];
  primary_image_url: string;
  gallery_image_urls: string[];
  digital_nomad_features: string[];
  last_verified_date: string;
  coordinates?: Coordinates;
  coworking_details?: {
    operating_hours: string | null;
    pricing_plans: PricingPlan[];
    specific_amenities_coworking: string[];
  };
  cafe_details?: {
    operating_hours: string;
    price_indication: string;
    menu_highlights_cafe: string[];
    wifi_reliability_notes: string;
  };
  accommodation_details?: {
    accommodation_type: string;
    price_per_night_thb_range: {
      min: number;
      max: number;
    };
    room_types_available: string[];
    specific_amenities_accommodation: string[];
  };
}
