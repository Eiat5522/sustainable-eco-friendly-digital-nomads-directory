import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CityCarousel } from '../CityCarousel';
import useEmblaCarousel from 'embla-carousel-react';

// Mock the module
jest.mock('embla-carousel-react');

// Mock embla-carousel-autoplay
jest.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock next/image and next/link
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: any) => <a href={href}>{children}</a> }));

// Define the mock object that tests will interact with
const emblaApiMock = {
  scrollPrev: jest.fn(),
  scrollNext: jest.fn(),
  canScrollPrev: jest.fn(() => true),
  canScrollNext: jest.fn(() => true),
  on: jest.fn(),
  off: jest.fn(),
  reInit: jest.fn(),
};

// Mock fetch globally
const mockFetch = jest.fn();
Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true,
});

describe('CityCarousel', () => {
  const mockCities = [
    { id: '1', name: 'City 1', slug: 'city-1', country: 'C1', imageUrl: null },
    { id: '2', name: 'City 2', slug: 'city-2', country: 'C2', imageUrl: null },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock return values
    emblaApiMock.canScrollPrev.mockReturnValue(true);
    emblaApiMock.canScrollNext.mockReturnValue(true);

    // Provide the mock implementation for the hook
    jest.mocked(useEmblaCarousel).mockReturnValue([jest.fn(), emblaApiMock]);

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ cities: mockCities }),
      }) as unknown as Promise<Response>
    );
  });

  it('renders loading state initially, then the carousel with cities', async () => {
    render(<CityCarousel />);
    expect(screen.getByText('Loading cities…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('City 1')).toBeInTheDocument();
      expect(screen.getByText('City 2')).toBeInTheDocument();
    });
  });

  it('calls scrollNext when the right arrow is clicked', async () => {
    render(<CityCarousel />);
    await waitFor(() => expect(screen.getByText('City 1')).toBeInTheDocument());

    const nextButton = screen.getByRole('button', { name: /Scroll cities right/i });
    fireEvent.click(nextButton);

    expect(emblaApiMock.scrollNext).toHaveBeenCalled();
  });

  it('calls scrollPrev when the left arrow is clicked', async () => {
    render(<CityCarousel />);
    await waitFor(() => expect(screen.getByText('City 1')).toBeInTheDocument());

    const prevButton = screen.getByRole('button', { name: /Scroll cities left/i });
    fireEvent.click(prevButton);

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
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('API Error')));

    render(<CityCarousel />);

    await waitFor(() => {
      expect(screen.getByText('Error: failed to fetch cities')).toBeInTheDocument();
    });
  });

  it('does not render carousel if no cities are returned', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ cities: [] }),
      }) as unknown as Promise<Response>
    );

    render(<CityCarousel />);

    await waitFor(() => {
      expect(screen.queryByText('Loading cities…')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
