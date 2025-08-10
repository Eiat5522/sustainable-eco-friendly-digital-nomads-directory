import { type AppListingCard } from '@/types/appView';
import { ListingCategory } from '@/types/enums';

export const mockListings: AppListingCard[] = [
  {
    id: '1',
    name: 'Eco-Friendly Coworking Space',
        slug: 'eco-friendly-coworking-space',
    shortDescription: 'A sustainable coworking space with solar panels and recycling',
    type: 'coworking',
    address: '123 Green Street, Bangkok',
    ecoFocusTags: [], // Empty array for reference types
    digitalNomadFeatures: ['high_speed_wifi', 'meeting_rooms'],
    primaryImage: { 
      _type: 'image',
      asset: { 
        _ref: 'image1-ref', 
        _type: 'reference',

      },
      alt: 'Coworking space'
    },
    city: {
      id: 'bangkok-id',
      name: 'Bangkok',
      slug: 'bangkok',
      country: 'Thailand',
    },
    
    
    galleryImages: []
  },
  {
    id: '2',
    name: 'Bamboo Eco Café',
    slug: 'bamboo-eco-cafe',
    shortDescription: 'Eco-conscious café serving local organic produce and using eco-friendly practices',
    
    type: 'cafe',
    address: '456 Bamboo Lane, Chiang Mai',
    ecoFocusTags: [],
    
    location: {
      lat: 18.7883,
      lng: 98.9853
    },
    
    primaryImage: { 
      _type: 'image',
      asset: { 
        _ref: 'image2-ref', 
        _type: 'reference',

      },
      alt: 'Bamboo café'
    },
    galleryImages: [
      { 
        _type: 'image',
        _key: 'gallery-1',
        asset: { 
          _ref: 'image3-ref', 
          _type: 'reference',
  
        },
        alt: 'Café interior'
      },
      { 
        _type: 'image',
        _key: 'gallery-2',
        asset: { 
          _ref: 'image4-ref', 
          _type: 'reference',
  
        },
        alt: 'Café exterior'
      }
    ],
    digitalNomadFeatures: ['wifi-available', 'power-outlets'],
        city: {
      id: 'chiangmai-id',
      name: 'Chiang Mai',
      slug: 'chiang-mai',
      country: 'Thailand',
    }
  }
];

export async function setupTestData() {
  // This would be used to insert test data into a test database
  // For now, we'll just use the mock data directly in tests
  return mockListings;
}
