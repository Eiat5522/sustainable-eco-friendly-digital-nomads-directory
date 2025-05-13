# Listing Data Schema (cline_docs/data_schema.md)

This document outlines the JSON schema for individual listings in the 'Sustainable Digital Nomads in Thailand' directory. The data will be stored as an array of listing objects.

## Core Listing Object Fields (Applicable to all categories)

-   `id`: (String) Unique identifier for the listing (e.g., UUID).
-   `name`: (String) The official name of the listing.
-   `city`: (String) The city where the listing is located (e.g., "Bangkok", "Chiang Mai", "Phuket", "Koh Lanta").
-   `category`: (String Enum) Type of listing. Possible values:
    -   `"coworking"`
    -   `"cafe"`
    -   `"accommodation"`
-   `address_string`: (String) Full street address.
-   `coordinates`: (Object) Geographic coordinates.
    -   `latitude`: (Number)
    -   `longitude`: (Number)
-   `description_short`: (String) A brief, one or two-sentence overview of the listing.
-   `description_long`: (String) A more detailed description.
-   `eco_focus_tags`: (Array of Strings) Standardized tags highlighting sustainability aspects. Examples:
    -   `"organic_food"`
    -   `"solar_power"`
    -   `"waste_reduction"`
    -   `"biophilic_design"` (use of natural elements, plants in design)
    -   `"community_focused"` (e.g., supports local community, hosts community events)
    -   `"green_building_materials"` (e.g., bamboo, reclaimed wood)
    -   `"plant_based_menu"` (significant vegan/vegetarian options)
    -   `"local_sourcing"` (ingredients, materials, etc.)
    -   `"water_conservation"`
    -   `"plastic_free_initiatives"`
    -   `"upcycled_materials"`
    -   `"ev_charging_station"`
    -   `"eco_education_programs"`
    -   `"carbon_neutral"`
-   `eco_notes_detailed`: (String) Longer, free-text notes detailing specific sustainability initiatives or observations not covered by tags.
-   `source_urls`: (Array of Strings) URLs where information about the listing was found (e.g., official website, review sites, articles).
-   `primary_image_url`: (String) URL of a main representative image for the listing. (Optional, if available).
-   `gallery_image_urls`: (Array of Strings) URLs of additional images for the listing. (Optional).
-   `digital_nomad_features`: (Array of Strings) Tags highlighting features relevant to digital nomads. Examples:
    -   `"fast_wifi"`
    -   `"reliable_wifi"`
    -   `"power_outlets_abundant"`
    -   `"meeting_rooms_available"`
    -   `"quiet_work_zones"`
    -   `"community_events_networking"`
    -   `"coliving_option_available"`
    -   `"pet_friendly"`
    -   `"24_7_access"`
    -   `"ergonomic_seating"`
    -   `"on_site_food_drink"`
-   `last_verified_date`: (String) ISO 8601 date string (YYYY-MM-DD) indicating when the listing information was last checked or updated.

## Category-Specific Fields

### If `category` is `"coworking"`:
-   `coworking_details`: (Object)
    -   `operating_hours`: (String or Object) e.g., "Mon-Fri: 9am-6pm, Sat: 10am-4pm" or `{"monday_friday": "9am-6pm", "saturday": "10am-4pm", "sunday": "closed"}`.
    -   `pricing_plans`: (Array of Objects)
        -   `type`: (String Enum) e.g., `"daily"`, `"weekly"`, `"monthly"`, `"hot_desk"`, `"dedicated_desk"`.
        -   `price_thb`: (Number) Price in Thai Baht.
        -   `price_notes`: (String) Additional details about the price (e.g., "includes coffee", "minimum 3 months").
    -   `specific_amenities_coworking`: (Array of Strings) Examples:
        -   `"ac_rooms"`
        -   `"outdoor_seating_area"`
        -   `"skype_booths_call_rooms"`
        -   `"printer_scanner_copier"`
        -   `"monitor_rental_available"`
        -   `"on_site_cafe_restaurant"`
        -   `"kitchen_access_shared"`
        -   `"personal_lockers"`
        -   `"event_space_available"`
        -   `"bike_parking"`
        -   `"car_parking"`

### If `category` is `"cafe"`:
-   `cafe_details`: (Object)
    -   `operating_hours`: (String or Object) As above.
    -   `price_indication`: (String Enum) e.g., `"$"`, `"$$"`, `"$$$"`.
    -   `menu_highlights_cafe`: (Array of Strings) Examples:
        -   `"specialty_coffee_beans"`
        -   `"sourdough_bread_pastries"`
        -   `"extensive_vegan_options"`
        -   `"fresh_pressed_juices_smoothies"`
        -   `"brunch_menu"`
        -   `"local_thai_dishes"`
        -   `"craft_beer_wine"`
    -   `wifi_reliability_notes`: (String) Notes on Wi-Fi speed, stability, or suitability for work.

### If `category` is `"accommodation"`:
-   `accommodation_details`: (Object)
    -   `accommodation_type`: (String Enum) e.g., `"hotel"`, `"guesthouse"`, `"bungalow"`, `"resort"`, `"hostel"`, `"apartment_condo"`, `"villa"`, `"eco_lodge"`.
    -   `price_per_night_thb_range`: (Object or String) Price range per night in Thai Baht.
        -   `min`: (Number)
        -   `max`: (Number)
        -   (Alternatively, a string like "Approx 1500-3000 THB")
    -   `room_types_available`: (Array of Strings) Examples: `"private_room_ensuite"`, `"dorm_bed"`, `"studio_apartment"`, `"pool_villa"`.
    -   `specific_amenities_accommodation`: (Array of Strings) Examples:
        -   `"swimming_pool"`
        -   `"on_site_restaurant_bar"`
        -   `"private_beach_access"`
        -   `"fitness_center_gym"`
        -   `"spa_wellness_services"`
        -   `"in_room_kitchenette"`
        -   `"shared_kitchen_access"`
        -   `"laundry_facilities_service"`
        -   `"yoga_meditation_space"`
        -   `"bicycle_rental"`
        -   `"airport_shuttle_service"`

## Sample Listing Object (Illustrative)

```json
{
  "id": "uuid-goes-here",
  "name": "GreenLeaf Coworking & Cafe",
  "city": "Chiang Mai",
  "category": "coworking", // or "cafe" if it's primarily a cafe with good workspace
  "address_string": "123 Nimmanhaemin Road, Suthep, Mueang Chiang Mai District, Chiang Mai 50200, Thailand",
  "coordinates": {
    "latitude": 18.799000,
    "longitude": 98.967000
  },
  "description_short": "A vibrant coworking space and cafe in the heart of Nimman, offering a productive environment with a strong eco-conscious ethos.",
  "description_long": "GreenLeaf provides flexible desk options, private offices, and a delightful cafe serving organic coffee and plant-based snacks. We are committed to minimizing our environmental impact through various initiatives and fostering a community of like-minded professionals.",
  "eco_focus_tags": [
    "organic_food",
    "waste_reduction",
    "biophilic_design",
    "local_sourcing",
    "plastic_free_initiatives",
    "plant_based_menu"
  ],
  "eco_notes_detailed": "Uses solar panels for 30% of energy needs. All food waste is composted locally. Features an indoor vertical garden and uses reclaimed wood for furniture. Partners with local organic farms for cafe ingredients.",
  "source_urls": [
    "https://example.com/greenleaf",
    "https://www.tripadvisor.com/greenleaf_chiangmai"
  ],
  "primary_image_url": "https://example.com/images/greenleaf_main.jpg",
  "gallery_image_urls": [
    "https://example.com/images/greenleaf_interior.jpg",
    "https://example.com/images/greenleaf_cafe_food.jpg"
  ],
  "digital_nomad_features": [
    "fast_wifi",
    "power_outlets_abundant",
    "meeting_rooms_available",
    "quiet_work_zones",
    "community_events_networking",
    "on_site_food_drink",
    "ergonomic_seating"
  ],
  "last_verified_date": "2025-05-12",
  "coworking_details": { // Only if category is "coworking"
    "operating_hours": {
      "monday_friday": "8am-8pm",
      "saturday_sunday": "10am-6pm"
    },
    "pricing_plans": [
      { "type": "daily", "price_thb": 300, "price_notes": "Includes one free coffee." },
      { "type": "weekly", "price_thb": 1500, "price_notes": "" },
      { "type": "monthly_hot_desk", "price_thb": 4500, "price_notes": "" }
    ],
    "specific_amenities_coworking": [
      "ac_rooms",
      "outdoor_seating_area",
      "skype_booths_call_rooms",
      "printer_scanner_copier",
      "on_site_cafe_restaurant"
    ]
  }
  // cafe_details or accommodation_details would be here if category matched
}
