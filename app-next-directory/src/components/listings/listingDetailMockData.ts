// Mock data for listing detail page using existing DTO structure
import type { ListingDetailDTO, Percentage0To100 } from '@/types/dto';

export const mockListingDetail: ListingDetailDTO = {
  id: 'banyan-tree-phuket',
  name: 'Banyan Tree Phuket',
  slug: 'banyan-tree-phuket',
  type: 'accommodation' as const,
  city: {
    id: 'phuket',
    name: 'Phuket',
    slug: 'phuket',
    country: 'Thailand',
    sustainabilityScore: 85 as Percentage0To100,
    highlights: ['Beach Access', 'Eco Resort', 'Renewable Energy'],
    description: 'A tropical paradise committed to sustainability',
  },
  imageUrl: '/placeholder_image.png',
  ecoFocusTags: ['Solar Powered', 'Zero Waste', 'Local Sourcing', 'Water Conservation'],
  digitalNomadFeatures: ['High-Speed WiFi', 'Coworking Space', 'Meeting Rooms', '24/7 Access'],
  priceRange: 'premium' as const,
  website: 'https://banyantree.com',
  address: '33, 33/27 Moo 4, Srisoonthorn Road, Cherngtalay, Thalang, Phuket 83110, Thailand',
  location: { lat: 8.0863, lng: 98.2781 },
  shortDescription: 'Luxury eco-resort with stunning ocean views and sustainable practices',
  longDescription:
    `Nestled along the pristine shores of Phuket, Banyan Tree Phuket offers an unparalleled luxury experience while maintaining a strong commitment to environmental sustainability. Our resort features solar-powered facilities, zero-waste initiatives, and locally-sourced amenities that minimize our ecological footprint without compromising on comfort and elegance.\n\nFrom sunrise to sunset, you can work comfortably from shaded terraces, quiet lounges, and dedicated coworking corners. Reliable high-speed internet, thoughtfully designed workspaces, and mindful community programming help remote workers stay productive without feeling disconnected from nature.\n\nWe invest in long-term partnerships with local farmers and suppliers, reduce single-use plastics across operations, and continuously monitor energy and water usage to find new ways to improve. Guests are invited to join educational experiences—like guided conservation walks and workshops—so sustainability is not just a label, but a lived practice.\n\nWhether you're planning a short workcation or a longer stay, Banyan Tree Phuket aims to make it easy to balance deep focus, restorative rest, and responsible travel choices—all in one place.`,
  galleryImages: ['/placeholder_image.png', '/placeholder_image.png', '/placeholder_image.png'],
  amenities: [
    { id: 'wifi', name: 'High-Speed WiFi', slug: 'wifi', icon: 'wifi', category: 'connectivity' },
    { id: 'pool', name: 'Swimming Pool', slug: 'pool', icon: 'waves', category: 'recreation' },
    { id: 'spa', name: 'Spa Services', slug: 'spa', icon: 'flower', category: 'wellness' },
    {
      id: 'restaurant',
      name: 'On-site Restaurant',
      slug: 'restaurant',
      icon: 'utensils',
      category: 'dining',
    },
    { id: 'gym', name: 'Fitness Center', slug: 'gym', icon: 'dumbbell', category: 'fitness' },
    { id: 'parking', name: 'Free Parking', slug: 'parking', icon: 'car', category: 'transport' },
  ],
  contactPhone: '+66 76 372 400',
  contactEmail: 'phuket@banyantree.com',
  accommodationDetails: {
    accommodationType: 'Luxury Resort',
    pricePerNight: { amount: 8500, currency: 'THB', unit: 'night' },
    roomTypes: ['Pool Villa', 'Ocean View Suite', 'Garden Villa', 'Presidential Suite'],
    minimumStay: 2,
  },
};

export const mockRelatedListings = [
  {
    id: 'katathani-phuket',
    name: 'Katathani Phuket Beach Resort',
    slug: 'katathani-phuket',
    imageUrl: '/placeholder_image.png',
    city: 'Phuket',
    priceRange: 'premium' as const,
    ecoFocusTags: ['Ocean Conservation', 'Renewable Energy'],
  },
  {
    id: 'eco-resort-koh-samui',
    name: 'Eco Resort Koh Samui',
    slug: 'eco-resort-koh-samui',
    imageUrl: '',
    city: 'Koh Samui',
    priceRange: 'moderate' as const,
    ecoFocusTags: ['Organic Gardens', 'Solar Energy'],
  },
];

export const mockReviews = [
  {
    id: 'review-1',
    rating: 5,
    comment:
      'Absolutely stunning resort with incredible sustainability practices. The solar-powered facilities and zero-waste initiatives are impressive, and the staff is knowledgeable about eco-friendly practices.',
    user: { name: 'Sarah Johnson', image: '/placeholder_image.png' },
    createdAt: '2024-01-15T10:30:00Z',
    status: 'approved' as const,
  },
  {
    id: 'review-2',
    rating: 4,
    comment:
      'Beautiful location and great amenities. The coworking space is perfect for digital nomads, though the WiFi could be faster in some areas.',
    user: { name: 'Mike Chen', image: '/placeholder_image.png' },
    createdAt: '2024-01-10T14:20:00Z',
    status: 'approved' as const,
  },
  {
    id: 'review-3',
    rating: 5,
    comment:
      'The perfect blend of luxury and sustainability. Loved the locally-sourced food and the educational programs about marine conservation.',
    user: { name: 'Emma Rodriguez', image: '/placeholder_image.png' },
    createdAt: '2024-01-08T09:15:00Z',
    status: 'approved' as const,
  },
];

// String formatters for listing detail page
export const formatPrice = (amount: number, currency: string = 'THB', unit?: string): string => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return unit ? `${formattedAmount}/${unit}` : formattedAmount;
};

export const formatOpeningHours = (
  hours: Array<{ day: string; opens: string; closes: string }>
): string => {
  if (!hours || hours.length === 0) return 'Hours not available';

  return hours.map(h => `${h.day}: ${h.opens} - ${h.closes}`).join(', ');
};

export const formatRating = (rating: number): string => {
  return `${rating.toFixed(1)} stars`;
};

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};
