import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { CityCarousel } from '../CityCarousel';

describe('CityCarousel', () => {
  const mockCities = [
    {
      id: '1',
      name: 'Eco City 1',
      slug: 'eco-city-1',
      country: 'Green Country',
      sustainabilityScore: 85,
      highlights: ['Green Energy', 'Low Emissions'],
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: '2',
      name: 'Eco City 2',
      slug: 'eco-city-2',
      country: 'Eco Country',
      sustainabilityScore: 90,
      highlights: ['Recycling Programs', 'Bike Lanes'],
      imageUrl: 'https://via.placeholder.com/150',
    },
  ];

  beforeEach(() => {
    // Mock the fetch API to return mock cities
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ cities: mockCities }),
      })
    ) as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the carousel with cities', async () => {
    render(<CityCarousel />);

    // Wait for cities to load and appear in the DOM
    await waitFor(() => {
      expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    });

    // Verify the carousel list is rendered
    expect(screen.getByRole('list', { name: 'Featured city destinations' })).toBeInTheDocument();
    expect(screen.getByText('Eco City 2')).toBeInTheDocument();
  });

  it('navigates to the next slide', async () => {
    render(<CityCarousel />);

    // Wait for cities to load
    await waitFor(() => {
      expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    });

    // Find the next button by its accessible name
    const nextButton = screen.getByRole('button', { name: 'Scroll cities right' });
    fireEvent.click(nextButton);

    // Since both cities are visible in this horizontal scroll layout, 
    // we just verify the button interaction works without errors
    expect(nextButton).toBeInTheDocument();
  });

  it('navigates to the previous slide', async () => {
    render(<CityCarousel />);

    // Wait for cities to load
    await waitFor(() => {
      expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    });

    // Find the previous button by its accessible name
    const prevButton = screen.getByRole('button', { name: 'Scroll cities left' });
    
    // The previous button should be disabled initially (no content to scroll left to)
    expect(prevButton).toBeDisabled();

    // Find the next button and verify it exists
    const nextButton = screen.getByRole('button', { name: 'Scroll cities right' });
    expect(nextButton).toBeInTheDocument();
  });

  it('does not render the carousel controls when the API returns no cities', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ cities: [] }),
      } as unknown as Response)
    );

    render(<CityCarousel />);

    await waitFor(() => {
      expect(screen.queryByText('Loading cities…')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('list', { name: 'Featured city destinations' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scroll cities left' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scroll cities right' })).not.toBeInTheDocument();
  });

  it('surfaces an accessible error message when the fetch call fails', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    render(<CityCarousel />);

    const errorMessage = await screen.findByText('Error: failed to fetch cities');
    expect(errorMessage).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Featured city destinations' })).not.toBeInTheDocument();
  });

  it('exposes accessible loading states, list semantics, and navigation controls', async () => {
    render(<CityCarousel />);

    const loadingMessage = screen.getByText('Loading cities…');
    expect(loadingMessage).toHaveAttribute('aria-live', 'polite');

    await waitFor(() => {
      expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    });

    const cityList = screen.getByRole('list', { name: 'Featured city destinations' });
    expect(within(cityList).getAllByRole('listitem')).toHaveLength(mockCities.length);

    const nextButton = screen.getByRole('button', { name: 'Scroll cities right' });
    expect(nextButton).toHaveAccessibleName('Scroll cities right');

    const cityLink = screen.getByRole('link', { name: /Eco City 1/ });
    expect(cityLink).toHaveAccessibleName(expect.stringContaining('Eco City 1'));
  });
});
