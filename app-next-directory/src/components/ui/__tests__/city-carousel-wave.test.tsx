import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CityCarouselWave from '../city-carousel-wave';
import { CityDTO } from '@/types/dto';

// Mock gsap
jest.mock('gsap', () => ({
  to: jest.fn(),
  set: jest.fn(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, priority, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} fill={fill?.toString()} priority={priority?.toString()} />;
  },
}));

const mockCities: CityDTO[] = [
  { id: '1', name: 'City A', slug: 'city-a', country: 'Country A', imageUrl: '/city-a.jpg', sustainabilityScore: 85 },
  { id: '2', name: 'City B', slug: 'city-b', country: 'Country B', imageUrl: '/city-b.jpg', sustainabilityScore: 75 },
  { id: '3', name: 'City C', slug: 'city-c', country: 'Country C', imageUrl: '/city-c.jpg', sustainabilityScore: 55 },
];

describe('CityCarouselWave', () => {
  it('renders nothing when no cities are provided', () => {
    const { container } = render(<CityCarouselWave cities={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the carousel with cities', () => {
    render(<CityCarouselWave cities={mockCities} />);
    expect(screen.getByText('City A')).toBeInTheDocument();
    expect(screen.getByText('City B')).toBeInTheDocument();
    expect(screen.getByText('City C')).toBeInTheDocument();
  });

  it('shifts to the next city on next button click', () => {
    render(<CityCarouselWave cities={mockCities} />);
    const nextButton = screen.getByLabelText('Next city');
    fireEvent.click(nextButton);
    // After a click, the component state updates, and useEffect triggers gsap.
    // We can't easily test the visual state change without a more complex setup,
    // but we can verify that the component re-renders and the logic is called.
    expect(require('gsap').to).toHaveBeenCalled();
  });

  it('shifts to the previous city on prev button click', () => {
    render(<CityCarouselWave cities={mockCities} />);
    const prevButton = screen.getByLabelText('Previous city');
    fireEvent.click(prevButton);
    expect(require('gsap').to).toHaveBeenCalled();
  });

  it('displays the correct badge variant based on sustainability score', () => {
    render(<CityCarouselWave cities={mockCities} />);
    expect(screen.getByText('85%')).toHaveClass('bg-pink-600');
    expect(screen.getByText('75%')).toHaveClass('bg-indigo-600');
    expect(screen.getByText('55%')).toHaveClass('bg-orange-500');
  });

  it('handles image error by showing a placeholder', () => {
    const citiesWithBadImage: CityDTO[] = [
      { id: '4', name: 'City D', slug: 'city-d', country: 'Country D', imageUrl: 'bad-url', sustainabilityScore: 90 },
    ];
    render(<CityCarouselWave cities={citiesWithBadImage} />);
    const image = screen.getByAltText('City D') as HTMLImageElement;
    fireEvent.error(image);
    expect(image.src).toContain('/placeholder_image.png');
  });
});