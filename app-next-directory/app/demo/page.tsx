import React from 'react';
import ListingDetail from '@/components/listings/ListingDetail';
import { AppListingDetail } from '@/types/appView';

const mockListing: AppListingDetail = {
  id: 'demo-listing',
  name: 'Eco Paradise Coworking Space',
  slug: 'eco-paradise-coworking',
  city: {
    id: 'chiang-mai',
    name: 'Chiang Mai',
    slug: 'chiang-mai',
    country: 'Thailand'
  },
  type: 'coworking',
  ecoFocusTags: ['Solar Power', 'Zero Waste', 'Recycling Program', 'Green Building'],
  digitalNomadFeatures: ['High-Speed WiFi', 'Meeting Rooms', 'Coffee Bar'],
  location: { lat: 18.7883, lng: 98.9853 },
  primaryImage: undefined,
  galleryImages: undefined,
  amenities: [
    {
      _id: 'wifi',
      name: 'High-Speed WiFi',
      description: '100 Mbps fiber internet'
    },
    {
      _id: 'coffee',
      name: 'Coffee Bar',
      description: 'Organic, locally sourced coffee'
    },
    {
      _id: 'meeting',
      name: 'Meeting Rooms',
      description: 'Bookable private spaces'
    },
    {
      _id: 'solar',
      name: 'Solar Power',
      description: '100% renewable energy'
    }
  ],
  priceRange: 'moderate',
  contactEmail: 'hello@ecoparadise.com',
  contactPhone: '+66 83 123 4567',
  website: 'https://ecoparadise-coworking.com',
  shortDescription: 'A sustainable coworking space in the heart of Chiang Mai, powered by 100% renewable energy and designed for eco-conscious digital nomads.',
  longDescription: [
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Located in the heart of Chiang Mai, Eco Paradise Coworking Space is a pioneering sustainable workspace designed specifically for environmentally conscious digital nomads. Our facility operates on 100% renewable solar energy and features state-of-the-art amenities including high-speed fiber internet, comfortable ergonomic workstations, and private meeting rooms.'
        }
      ]
    }
  ],
  reviews: [
    {
      id: 'review-1',
      listingId: 'demo-listing',
      userId: 'user-1',
      rating: 5,
      comment: 'Amazing space! The solar-powered setup is fantastic and the internet speed is incredible. Perfect for remote work.',
      createdAt: '2024-01-15T10:30:00Z',
      user: {
        name: 'Sarah Johnson',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b9e22386?w=40&h=40&fit=crop&crop=face'
      }
    },
    {
      id: 'review-2',
      listingId: 'demo-listing',
      userId: 'user-2',
      rating: 4,
      comment: 'Love the eco-friendly approach and the community here. Great coffee too!',
      createdAt: '2024-01-10T14:20:00Z',
      user: {
        name: 'Mike Chen',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
      }
    },
    {
      id: 'review-3',
      listingId: 'demo-listing',
      userId: 'user-3',
      rating: 5,
      comment: 'Best coworking space in Chiang Mai! The sustainability focus really sets it apart.',
      createdAt: '2024-01-05T09:15:00Z',
      user: {
        name: 'Emma Rodriguez'
      }
    }
  ],
  coworkingDetails: {
    pricingPlans: [
      { type: 'Day Pass', price: 300, period: 'per day' },
      { type: 'Weekly', price: 1800, period: 'per week' },
      { type: 'Monthly', price: 6500, period: 'per month' }
    ],
    openingHours: [
      { day: 'Monday', opens: '08:00', closes: '20:00' },
      { day: 'Tuesday', opens: '08:00', closes: '20:00' },
      { day: 'Wednesday', opens: '08:00', closes: '20:00' },
      { day: 'Thursday', opens: '08:00', closes: '20:00' },
      { day: 'Friday', opens: '08:00', closes: '20:00' },
      { day: 'Saturday', opens: '10:00', closes: '18:00' },
      { day: 'Sunday', opens: '10:00', closes: '18:00' }
    ]
  },
  address: '123 Nimmanha Road, Su Thep, Mueang Chiang Mai District, Chiang Mai 50200, Thailand'
};

export default function DemoListingPage() {
  return <ListingDetail listing={mockListing} />;
}