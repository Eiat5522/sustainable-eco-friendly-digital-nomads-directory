import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/image to a simple img for the test environment
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} />;
}}));

// Mock next/link to render a plain anchor
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: any) => {
  return <a href={href}>{children}</a>;
}}));

import { CityCarousel } from '../CityCarousel';

describe('CityCarousel', () => {
  const fakeCities = [
    { id: '1', slug: 'city-1', name: 'City 1', country: 'C1', imageUrl: null },
    { id: '2', slug: 'city-2', name: 'City 2', country: 'C2', imageUrl: null },
    { id: '3', slug: 'city-3', name: 'City 3', country: 'C3', imageUrl: null },
  ];

  beforeEach(() => {
    // Mock global fetch to return our cities
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ cities: fakeCities }) }) as unknown as Promise<Response>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-ignore
    delete global.fetch;
  });

  it('renders and navigates when arrows are clicked', async () => {
    // Spy on scrollIntoView to ensure it's invoked
    const scrollSpy = jest.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});

    render(<CityCarousel />);

    // Wait for cities to be rendered
    await waitFor(() => expect(screen.getByText('City 1')).toBeInTheDocument());

    // Left and right buttons should be rendered (hidden on small screens via classes, but present)
    const left = screen.getByRole('button', { name: /Scroll cities left/i });
    const right = screen.getByRole('button', { name: /Scroll cities right/i });

    // Initially, left should be disabled and right enabled (we have >1 city)
    expect(left).toBeDisabled();
    expect(right).toBeEnabled();

    // Click right once - should call scrollIntoView and enable left
    fireEvent.click(right);
    await waitFor(() => expect(scrollSpy).toHaveBeenCalled());
    expect(left).toBeEnabled();
    expect(right).toBeEnabled();

    // Click right again to move to last item
    fireEvent.click(right);
    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(2));

    // Now right should be disabled (at last index)
    await waitFor(() => expect(right).toBeDisabled());

    scrollSpy.mockRestore();
  });
});
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
    {
      id: '3',
      name: 'Eco City 3',
      slug: 'eco-city-3',
      country: 'Sustainable Country',
      sustainabilityScore: 88,
      highlights: ['Solar Power', 'Green Transport'],
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: '4',
      name: 'Eco City 4',
      slug: 'eco-city-4',
      country: 'Clean Country',
      sustainabilityScore: 92,
      highlights: ['Waste Management', 'Clean Energy'],
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: '5',
      name: 'Eco City 5',
      slug: 'eco-city-5',
      country: 'Greenland',
      sustainabilityScore: 87,
      highlights: ['Eco Tourism', 'Conservation'],
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

    // Find the next button by its correct accessible name
    const nextButton = screen.getByRole('button', { name: 'Scroll cities right' });
    fireEvent.click(nextButton);

    // Verify navigation: after clicking next, the second city should be visible
    // (assuming the carousel scrolls to show the next item)
    await waitFor(() => {
      expect(screen.getByText('Eco City 2')).toBeInTheDocument();
    });

    // Optionally, verify the first city is no longer the primary visible item
    // (this depends on carousel implementation; adjust if needed)
    const carouselContainer = screen.getByRole('list', { name: 'Featured city destinations' });
    expect(within(carouselContainer).getByText('Eco City 2')).toBeInTheDocument();
  });

  it('navigates to the previous slide', async () => {
    render(<CityCarousel />);

    // Wait for cities to load
    await waitFor(() => {
      expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    });

    // Find the previous button by its accessible name
    const prevButton = screen.getByRole('button', { name: 'Scroll cities left' });

    // Verify button exists and works
    expect(prevButton).toBeInTheDocument();

    // Find the next button and verify it exists
    const nextButton = screen.getByRole('button', { name: 'Scroll cities right' });
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

    expect(screen.queryByRole('button', { name: 'Scroll cities left' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scroll cities right' })).not.toBeInTheDocument();
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

    const nextButton = screen.getByRole('button', { name: 'Scroll cities right' });
    expect(nextButton).toHaveAccessibleName('Scroll cities right');

    const cityLink = screen.getByRole('link', { name: /Eco City 1/ });
    expect(cityLink).toHaveAccessibleName(expect.stringContaining('Eco City 1'));
  });
});
