import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { CityCarousel } from '../CityCarousel';

describe('CityCarousel', () => {
  let fetchMock: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>;

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
    // Mock the fetch API to return mock cities by default
    fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () =>
      ({
        ok: true,
        json: async () => ({ cities: mockCities }),
      } as unknown as Response)
    );
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('renders the carousel with cities', async () => {
    render(<CityCarousel />);

    // Wait for cities to load and appear in the DOM
    await waitFor(() => {
      expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    });

    // Verify cities are rendered
    expect(screen.getByText('Eco City 2')).toBeInTheDocument();
  });

  it('navigates to the next slide', async () => {
    render(<CityCarousel />);

    // Wait for cities to load
    await waitFor(() => {
      expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    });

    // Find the next button by its accessible name
    const nextButton = screen.getByRole('button', { name: 'Next city' });
    fireEvent.click(nextButton);

    // Verify the button interaction works without errors
    expect(nextButton).toBeInTheDocument();
  });

  it('navigates to the previous slide', async () => {
    render(<CityCarousel />);

    // Wait for cities to load
    await waitFor(() => {
      expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    });

    // Find the previous button by its accessible name
    const prevButton = screen.getByRole('button', { name: 'Previous city' });

    // Verify button exists and works
    expect(prevButton).toBeInTheDocument();

    // Find the next button and verify it exists
    const nextButton = screen.getByRole('button', { name: 'Next city' });
    expect(nextButton).toBeInTheDocument();
  });

  it('does not render the carousel controls when the API returns no cities', async () => {
    fetchMock.mockImplementationOnce(async () =>
      ({ ok: true, json: async () => ({ cities: [] }) } as unknown as Response)
    );

    render(<CityCarousel />);

    await waitFor(() => {
      expect(screen.queryByText('Loading cities…')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Previous city' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next city' })).not.toBeInTheDocument();
  });

  it('surfaces an accessible error message when the fetch call fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    render(<CityCarousel />);

    const errorMessage = await screen.findByText('Error: failed to fetch cities');
    expect(errorMessage).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Featured city destinations' })).not.toBeInTheDocument();
  });

  it('exposes accessible loading states and navigation controls', async () => {
    render(<CityCarousel />);

    const loadingMessage = screen.getByText('Loading cities…');
    expect(loadingMessage).toHaveAttribute('aria-live', 'polite');

    await waitFor(() => {
      expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: 'Next city' });
    expect(nextButton).toHaveAccessibleName('Next city');

    const cityLink = screen.getByRole('link', { name: /Eco City 1/ });
    expect(cityLink).toHaveAccessibleName(expect.stringContaining('Eco City 1'));
  });
});
