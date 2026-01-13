import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CityDetailView } from '@/components/city/CityDetailView';
import type { CityDetailDTO, ListingSummaryDTO } from '@/types/dto';

jest.mock('next/image', () => {
  return function MockNextImage({
    alt,
    src,
    priority,
    fill,
    onError,
    ...props
  }: {
    alt: string;
    src: string | { src: string };
    priority?: boolean;
    fill?: boolean;
    onError?: () => void;
  }) {
    const resolvedSrc = typeof src === 'string' ? src : (src?.src ?? '');
    return (
      // eslint-disable-next-line @next/next/no-img-element
      // biome-ignore lint/performance/noImgElement: test-only Next/Image mock
      <img
        alt={alt}
        src={resolvedSrc}
        onError={onError}
        data-testid="next-image"
        data-fill={fill ? 'true' : 'false'}
        data-priority={priority ? 'true' : 'false'}
        {...props}
      />
    );
  };
});

jest.mock('lucide-react', () => ({
  __esModule: true,
  Leaf: ({ children, ...props }: any) => (
    <svg data-icon="leaf" {...props}>
      {children}
    </svg>
  ),
  MapPin: ({ children, ...props }: any) => (
    <svg data-icon="map-pin" {...props}>
      {children}
    </svg>
  ),
  Wifi: ({ children, ...props }: any) => (
    <svg data-icon="wifi" {...props}>
      {children}
    </svg>
  ),
  DollarSign: ({ children, ...props }: any) => (
    <svg data-icon="dollar" {...props}>
      {children}
    </svg>
  ),
  Thermometer: ({ children, ...props }: any) => (
    <svg data-icon="thermometer" {...props}>
      {children}
    </svg>
  ),
  Shield: ({ children, ...props }: any) => (
    <svg data-icon="shield" {...props}>
      {children}
    </svg>
  ),
  Footprints: ({ children, ...props }: any) => (
    <svg data-icon="footprints" {...props}>
      {children}
    </svg>
  ),
  Wind: ({ children, ...props }: any) => (
    <svg data-icon="wind" {...props}>
      {children}
    </svg>
  ),
}));

jest.mock('@/components/listings/RelatedListings', () => ({
  __esModule: true,
  RelatedListings: ({ listings }: { listings: ListingSummaryDTO[] }) => (
    <div data-testid="related-listings" data-count={listings.length}>
      {listings.map(listing => (
        <span key={listing.id}>{listing.name}</span>
      ))}
    </div>
  ),
}));

describe('CityDetailView', () => {
  const makeCityDetail = (overrides: Partial<CityDetailDTO> = {}): CityDetailDTO => ({
    id: 'testopolis',
    name: 'Testopolis',
    slug: 'testopolis',
    country: 'Testland',
    description: 'Testopolis balances sustainability with vibrant urban life.',
    imageUrl: 'https://example.com/testopolis.jpg',
    sustainabilityScore: 78 as import('@/types/dto').Percentage0To100,
    shortDescription: 'Concise overview of Testopolis metrics.',
    internetSpeed: { download: 120, upload: 40 },
    costOfLiving: 'Affordable (index 68)',
    climate: 'Tropical with mild winters',
    safety: 'Very safe for visitors',
    walkability: 'Excellent pedestrian network',
    airQuality: 'Good (AQI 45)',
    sustainabilityInitiatives: ['Solar rooftops', 'Zero waste markets'],
    digitalNomadFeatures: ['Community events', 'Coworking passes'],
    highlights: ['Green rooftops', 'Bike sharing', 'River taxis'],
    ...overrides,
  });

  const sampleListings: ListingSummaryDTO[] = [
    {
      id: 'listing-1',
      name: 'Eco Hub Workspace',
      slug: 'eco-hub-workspace',
      type: 'coworking',
      city: {
        id: 'testopolis',
        name: 'Testopolis',
        slug: 'testopolis',
        country: 'Testland',
      },
      imageUrl: 'https://example.com/listing-1.jpg',
      ecoFocusTags: ['Solar Powered', 'Zero Waste'],
      amenityNames: ['Fast WiFi', 'Private Rooms'],
    },
    {
      id: 'listing-2',
      name: 'Green Stay Apartments',
      slug: 'green-stay-apartments',
      type: 'accommodation',
      city: {
        id: 'testopolis',
        name: 'Testopolis',
        slug: 'testopolis',
        country: 'Testland',
      },
      imageUrl: 'https://example.com/listing-2.jpg',
      ecoFocusTags: ['Rainwater Harvesting'],
      amenityNames: ['Gym Access'],
    },
  ];

  it('renders city information, quick facts, and listings when details are provided', () => {
    const city = makeCityDetail();

    render(<CityDetailView city={city} listings={sampleListings} />);

    expect(screen.getByRole('heading', { name: 'Testopolis' })).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(
      screen.getByText('Testopolis balances sustainability with vibrant urban life.')
    ).toBeInTheDocument();

    expect(screen.getByText('Quick Facts')).toBeInTheDocument();
    expect(screen.getByText('120↓ / 40↑ Mbps')).toBeInTheDocument();
    expect(screen.getByText('Affordable (index 68)')).toBeInTheDocument();
    expect(screen.getByText('Tropical with mild winters')).toBeInTheDocument();
    expect(screen.getByText('Very safe for visitors')).toBeInTheDocument();
    expect(screen.getByText('Excellent pedestrian network')).toBeInTheDocument();
    expect(screen.getByText('Good (AQI 45)')).toBeInTheDocument();

    city.sustainabilityInitiatives?.forEach(initiative => {
      expect(screen.getByText(initiative)).toBeInTheDocument();
    });
    city.digitalNomadFeatures?.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
    city.highlights?.forEach(highlight => {
      expect(screen.getByText(highlight)).toBeInTheDocument();
    });

    expect(screen.getByTestId('related-listings')).toHaveAttribute(
      'data-count',
      sampleListings.length.toString()
    );
    sampleListings.forEach(listing => {
      expect(screen.getByText(listing.name)).toBeInTheDocument();
    });
  });

  it('formats numeric internet speed values correctly', () => {
    const city = makeCityDetail({ internetSpeed: 95 });

    render(<CityDetailView city={city} listings={sampleListings} />);

    expect(screen.getByText('95 Mbps avg')).toBeInTheDocument();
  });

  it('hides the remote city image when it fails to load', async () => {
    const city = makeCityDetail();

    render(<CityDetailView city={city} listings={sampleListings} />);

    const image = screen.getByAltText('Testopolis cityscape');
    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.queryByAltText('Testopolis cityscape')).not.toBeInTheDocument();
    });
  });

  it('omits quick fact entries when values are empty or invalid', () => {
    const city = makeCityDetail({
      internetSpeed: {
        download: 'fast',
        upload: 'slow',
      } as unknown as import('@/types/dto').InternetSpeedValue,
      costOfLiving: '   ',
      climate: '',
      safety: undefined,
      walkability: null as unknown as string,
      airQuality: undefined,
      sustainabilityInitiatives: [],
      digitalNomadFeatures: [],
      highlights: [],
    });

    render(<CityDetailView city={city} listings={sampleListings} />);

    const quickFactsHeading = screen.getByText('Quick Facts');
    const quickFactsContainer = quickFactsHeading.closest('div');
    expect(quickFactsContainer).not.toBeNull();
    const factRows = quickFactsContainer!.querySelectorAll('.flex.items-center.gap-2');
    expect(factRows.length).toBe(0);

    expect(screen.queryByText(/Mbps/)).not.toBeInTheDocument();
    expect(screen.queryByText('Affordable (index 68)')).not.toBeInTheDocument();
    expect(screen.queryByText('Tropical with mild winters')).not.toBeInTheDocument();
    expect(screen.queryByText('Very safe for visitors')).not.toBeInTheDocument();
    expect(screen.queryByText('Excellent pedestrian network')).not.toBeInTheDocument();
    expect(screen.queryByText('Good (AQI 45)')).not.toBeInTheDocument();

    expect(screen.queryByText('Sustainability Initiatives')).not.toBeInTheDocument();
    expect(screen.queryByText('Digital Nomad Features')).not.toBeInTheDocument();
  });
});
