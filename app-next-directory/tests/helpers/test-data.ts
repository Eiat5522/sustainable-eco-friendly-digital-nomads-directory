import { type Listing } from '../../../sanity/sanity.types';
import { ListingCategory } from '@/types/enums';

export const mockListings: Listing[] = [
  {
    _id: '1',
    _type: 'listing',
    _createdAt: '2023-01-01T00:00:00Z',
    _updatedAt: '2023-01-01T00:00:00Z',
    _rev: 'v1',
    name: 'Eco-Friendly Coworking Space',
    slug: { _type: 'slug', current: 'eco-friendly-coworking-space' },
    shortDescription: 'A sustainable coworking space with solar panels and recycling',
    type: 'coworking',
    address: '123 Green Street, Bangkok',
    ecoFocusTags: [], // Empty array for reference types
    digitalNomadFeatures: [
      {
        _ref: 'high_speed_wifi',
        _type: 'reference',
        _key: 'high_speed_wifi'
      },
      {
        _ref: 'meeting_rooms',
        _type: 'reference',
        _key: 'meeting_rooms'
      }
    ],
    primaryImage: { 
      _type: 'image',
      asset: { 
        _ref: 'image1-ref', 
        _type: 'reference',
        _weak: false
      },
      alt: 'Coworking space'
    },
    city: {
      _ref: 'bangkok-ref',
      _type: 'reference',
      _weak: false
    },
    longDescription: 'A sustainable coworking space in the heart of Bangkok',
    sourceUrls: [],
    galleryImages: []
  },
  {
    _id: '2',
    _type: 'listing',
    _createdAt: '2023-01-01T00:00:00Z',
    _updatedAt: '2023-07-01T00:00:00Z',
    _rev: 'v2',
    name: 'Bamboo Eco Café',
    slug: { _type: 'slug', current: 'bamboo-eco-cafe' },
    shortDescription: 'Eco-conscious café serving local organic produce and using eco-friendly practices',
    longDescription: [],
    type: 'cafe',
    address: '456 Bamboo Lane, Chiang Mai',
    ecoFocusTags: [],
    sourceUrls: ['https://bambooecocafe.example.com'],
    location: {
      _type: 'geopoint',
      lat: 18.7883,
      lng: 98.9853
    },
    moderation: {
      status: 'approved',
      featured: true,
    },
    primaryImage: { 
      _type: 'image',
      asset: { 
        _ref: 'image2-ref', 
        _type: 'reference',
        _weak: false
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
          _weak: false
        },
        alt: 'Café interior'
      },
      { 
        _type: 'image',
        _key: 'gallery-2',
        asset: { 
          _ref: 'image4-ref', 
          _type: 'reference',
          _weak: false
        },
        alt: 'Café exterior'
      }
    ],
    digitalNomadFeatures: [
      {
        _ref: 'wifi-available',
        _type: 'reference',
        _key: 'wifi-available'
      },
      {
        _ref: 'power-outlets',
        _type: 'reference',
        _key: 'power-outlets'
      }
    ],
    city: {
      _ref: 'chiangmai-ref',
      _type: 'reference',
      _weak: false
    }
  }
];

export async function setupTestData() {
  // This would be used to insert test data into a test database
  // For now, we'll just use the mock data directly in tests
  return mockListings;
}
