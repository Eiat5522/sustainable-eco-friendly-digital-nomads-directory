export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface Listing {
  id: string;
  name: string;
  city: string;
  category: 'coworking' | 'cafe' | 'accommodation';
  address_string: string;
  coordinates: Coordinates;
  description_short: string;
  description_long: string;
  eco_focus_tags: string[];
  eco_notes_detailed: string;
  source_urls: string[];
  primary_image_url: string;
  gallery_image_urls: string[];
  digital_nomad_features: string[];
  last_verified_date: string;
  coworking_details?: {
    operating_hours: string | null;
    pricing_plans: any[];
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
