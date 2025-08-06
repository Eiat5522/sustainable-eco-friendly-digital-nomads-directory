// Mock data for testing image display functionality
export const mockCities = [
  {
    _id: 'city-1',
    title: 'Bangkok',
    description: 'Thailand\'s vibrant capital city with excellent coworking spaces and sustainable cafes.',
    slug: 'bangkok',
    mainImage: {
      asset: {
        _id: 'image-bangkok',
        url: 'https://cdn.sanity.io/images/sc70w3cr/production/sample-bangkok.jpg',
        metadata: {
          dimensions: {
            width: 800,
            height: 600
          }
        }
      }
    },
    country: 'Thailand',
    sustainabilityScore: 85,
    highlights: ['Eco-friendly transport', 'Green coworking spaces', 'Sustainable dining']
  },
  {
    _id: 'city-2',
    title: 'Chiang Mai',
    description: 'Northern Thailand\'s cultural hub known for its digital nomad community.',
    slug: 'chiang-mai',
    mainImage: {
      asset: {
        _id: 'image-chiang-mai',
        url: 'https://cdn.sanity.io/images/sc70w3cr/production/sample-chiang-mai.jpg',
        metadata: {
          dimensions: {
            width: 800,
            height: 600
          }
        }
      }
    },
    country: 'Thailand',
    sustainabilityScore: 90,
    highlights: ['Mountain air quality', 'Local organic markets', 'Eco-lodges']
  },
  {
    _id: 'city-3',
    title: 'Koh Samui',
    description: 'Tropical island paradise with beachside coworking and eco-resorts.',
    slug: 'koh-samui',
    mainImage: {
      asset: {
        _id: 'image-koh-samui',
        url: 'https://cdn.sanity.io/images/sc70w3cr/production/sample-koh-samui.jpg',
        metadata: {
          dimensions: {
            width: 800,
            height: 600
          }
        }
      }
    },
    country: 'Thailand',
    sustainabilityScore: 80,
    highlights: ['Beach cleanup initiatives', 'Solar-powered cafes', 'Marine conservation']
  }
];

export const mockFeaturedListings = [
  {
    _id: 'listing-1',
    _type: 'listing',
    name: 'Green Space Coworking',
    slug: 'green-space-coworking-bangkok',
    category: 'coworking' as const,
    city: 'Bangkok',
    description: 'Eco-friendly coworking space in the heart of Bangkok with solar power and recycling programs.',
    mainImage: {
      _type: 'image' as const,
      asset: {
        _ref: 'image-green-space',
        _type: 'reference' as const,
        url: 'https://cdn.sanity.io/images/sc70w3cr/production/sample-coworking.jpg'
      }
    },
    ecoTags: ['Solar Power', 'Recycling', 'Green Building'],
    rating: 4.8,
    priceRange: '฿300-500/day',
    descriptionShort: 'Sustainable coworking with excellent WiFi and eco-friendly amenities.'
  },
  {
    _id: 'listing-2',
    _type: 'listing',
    name: 'Organic Café & Co-work',
    slug: 'organic-cafe-chiang-mai',
    category: 'cafe' as const,
    city: 'Chiang Mai',
    description: 'Local organic café with reliable WiFi and zero-waste practices.',
    mainImage: {
      _type: 'image' as const,
      asset: {
        _ref: 'image-organic-cafe',
        _type: 'reference' as const,
        url: 'https://cdn.sanity.io/images/sc70w3cr/production/sample-cafe.jpg'
      }
    },
    ecoTags: ['Organic', 'Zero Waste', 'Local Sourcing'],
    rating: 4.6,
    priceRange: '฿100-200/item',
    descriptionShort: 'Farm-to-table café with excellent coffee and work-friendly atmosphere.'
  },
  {
    _id: 'listing-3',
    _type: 'listing',
    name: 'Eco Beach Resort',
    slug: 'eco-beach-resort-koh-samui',
    category: 'accommodation' as const,
    city: 'Koh Samui',
    description: 'Sustainable beachfront accommodation with solar power and water conservation.',
    mainImage: {
      _type: 'image' as const,
      asset: {
        _ref: 'image-eco-resort',
        _type: 'reference' as const,
        url: 'https://cdn.sanity.io/images/sc70w3cr/production/sample-resort.jpg'
      }
    },
    ecoTags: ['Solar Power', 'Water Conservation', 'Marine Protection'],
    rating: 4.9,
    priceRange: '฿2000-4000/night',
    descriptionShort: 'Luxury eco-resort with stunning ocean views and sustainable practices.'
  }
];