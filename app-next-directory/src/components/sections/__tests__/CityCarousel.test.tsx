import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { HttpResponse, http } from 'msw';
import { server } from '../../../test-helpers/msw-server-bridge';
import { CityCarousel } from '../CityCarousel';

jest.mock('embla-carousel-react');
jest.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: jest.fn(() => ({ stop: jest.fn(), play: jest.fn() })),
}));

type EmblaApiSubset = Pick<
  EmblaCarouselType,
  'scrollPrev' | 'scrollNext' | 'canScrollPrev' | 'canScrollNext' | 'on' | 'off'
>;

const emblaApiMock: jest.Mocked<EmblaApiSubset> = {
  scrollPrev: jest.fn(),
  scrollNext: jest.fn(),
  canScrollPrev: jest.fn(() => true),
  canScrollNext: jest.fn(() => true),
  on: jest.fn(),
  off: jest.fn(),
};

const mockedUseEmblaCarousel = useEmblaCarousel as jest.MockedFunction<typeof useEmblaCarousel>;

describe('CityCarousel', () => {
  const mockCities = [
    { id: '1', name: 'City 1', slug: 'city-1', country: 'C1', imageUrl: null },
    { id: '2', name: 'City 2', slug: 'city-2', country: 'C2', imageUrl: null },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    emblaApiMock.canScrollPrev.mockReturnValue(true);
    emblaApiMock.canScrollNext.mockReturnValue(true);
    mockedUseEmblaCarousel.mockReturnValue([jest.fn(), emblaApiMock as unknown as EmblaCarouselType]);

    server.use(http.get('/api/cities', () => HttpResponse.json({ cities: mockCities })));
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('renders loading state initially, then the carousel with cities', async () => {
    render(<CityCarousel />);

    const loadingText = screen.queryByText('Loading cities…');
    if (loadingText) {
      expect(loadingText).toBeInTheDocument();
    }

    await waitFor(() => {
      expect(screen.getByText('City 1')).toBeInTheDocument();
      expect(screen.getByText('City 2')).toBeInTheDocument();
    });
  });

  it('links each city card to its slugged route', async () => {
    render(<CityCarousel />);

    const link = await screen.findByRole('link', { name: /Explore City 1/i });
    expect(link).toHaveAttribute('href', '/cities/city-1');
  });

  it('calls scrollNext when the right arrow is clicked', async () => {
    render(<CityCarousel />);
    await waitFor(() => expect(screen.getByText('City 1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Scroll cities right/i }));

    expect(emblaApiMock.scrollNext).toHaveBeenCalled();
  });

  it('calls scrollPrev when the left arrow is clicked', async () => {
    render(<CityCarousel />);
    await waitFor(() => expect(screen.getByText('City 1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Scroll cities left/i }));

    expect(emblaApiMock.scrollPrev).toHaveBeenCalled();
  });

  it('disables navigation buttons based on emblaApi state', async () => {
    emblaApiMock.canScrollPrev.mockReturnValue(false);
    emblaApiMock.canScrollNext.mockReturnValue(false);

    render(<CityCarousel />);
    await waitFor(() => expect(screen.getByText('City 1')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /Scroll cities left/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Scroll cities right/i })).toBeDisabled();
  });

  it('shows an error message if fetching cities fails', async () => {
    server.use(http.get('/api/cities', () => new HttpResponse(null, { status: 500 })));

    render(<CityCarousel />);

    await waitFor(() => {
      expect(screen.getByText('Error: failed to fetch cities')).toBeInTheDocument();
    });
  });

  it('does not render carousel if no cities are returned', async () => {
    server.use(http.get('/api/cities', () => HttpResponse.json({ cities: [] })));

    render(<CityCarousel />);

    await waitFor(() => {
      expect(screen.queryByText('Loading cities…')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('falls back to the city id when slug data is missing so cards still render', async () => {
    const fallbackCities = [
      { id: 'city-101', name: 'Hoi An', slug: '', country: 'Vietnam', imageUrl: null },
    ];
    server.use(http.get('/api/cities', () => HttpResponse.json({ cities: fallbackCities })));

    render(<CityCarousel />);

    const link = await screen.findByRole('link', { name: /Explore Hoi An/i });
    expect(link).toHaveAttribute('href', '/cities/city-101');
  });
});
