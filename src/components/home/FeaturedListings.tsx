'use client';

interface ListingType {
  id: string;
  title: string;
  description: string;
  type: 'accommodation' | 'coworking' | 'cafe';
  price: {
    amount: number;
    currency: string;
    period: string;
  };
  location: string;
  imageUrl: string;
  ecoFeatures: string[];
  rating: number;
  reviewCount: number;
}

interface FeaturedListingsProps {
  listings?: ListingType[];
}

const sampleListings: ListingType[] = [
  {
    id: '1',
    title: 'Eco Villa with Workspace',
    description: 'Solar-powered villa with dedicated workspace and organic garden',
    type: 'accommodation',
    price: {
      amount: 1200,
      currency: 'USD',
      period: 'month'
    },
    location: 'Ubud, Bali',
    imageUrl: '/images/listings/eco-villa-bali.jpg',
    ecoFeatures: ['Solar Powered', 'Organic Garden', 'Water Recycling'],
    rating: 4.8,
    reviewCount: 24
  },
  {
    id: '2',
    title: 'Green Coworking Hub',
    description: 'Sustainable coworking space using renewable energy',
    type: 'coworking',
    price: {
      amount: 200,
      currency: 'USD',
      period: 'month'
    },
    location: 'Chiang Mai',
    imageUrl: '/images/listings/green-hub-chiangmai.jpg',
    ecoFeatures: ['100% Renewable', 'Zero Waste', 'Bike Parking'],
    rating: 4.9,
    reviewCount: 36
  },
  {
    id: '3',
    title: 'Eco Cafe & Workspace',
    description: 'Zero-waste cafe with high-speed internet and workspace',
    type: 'cafe',
    price: {
      amount: 15,
      currency: 'USD',
      period: 'day'
    },
    location: 'Lisbon',
    imageUrl: '/images/listings/eco-cafe-lisbon.jpg',
    ecoFeatures: ['Zero Waste', 'Local Produce', 'Energy Efficient'],
    rating: 4.7,
    reviewCount: 42
  }
];

export default function FeaturedListings({ listings = sampleListings }: FeaturedListingsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          {/* Image Container */}
          <div className="relative h-48">
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-lg font-medium`}>
              {listing.title}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {listing.type}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{listing.description}</p>

            <div className="flex items-center text-sm text-gray-500 mb-2">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {listing.location}
            </div>

            {/* Eco Features */}
            <div className="flex flex-wrap gap-2 mb-3">
              {listing.ecoFeatures.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Price and Rating */}
            <div className="flex justify-between items-center">
              <div className="text-gray-900">
                <span className="font-bold">{listing.price.currency} {listing.price.amount}</span>
                <span className="text-gray-500 text-sm">/{listing.price.period}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-sm text-gray-600">
                  {listing.rating} ({listing.reviewCount})
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
