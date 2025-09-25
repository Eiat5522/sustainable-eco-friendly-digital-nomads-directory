import { render, screen, fireEvent } from '@testing-library/react';
import EcoCityCarousel from '@/components/cities/CityCarousel';

describe('EcoCityCarousel', () => {
  const mockCities = [
    {
      _id: '1',
      name: 'Eco City 1',
      sustainabilityScore: 85,
      highlights: ['Green Energy', 'Low Emissions'],
      image: { asset: { url: 'https://via.placeholder.com/150' } },
    },
    {
      _id: '2',
      name: 'Eco City 2',
      sustainabilityScore: 90,
      highlights: ['Recycling Programs', 'Bike Lanes'],
      image: { asset: { url: 'https://via.placeholder.com/150' } },
    },
  ];

  it('renders the carousel with cities', () => {
    render(<EcoCityCarousel cities={mockCities} />);

    expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    expect(screen.getByText('Eco City 2')).toBeInTheDocument();
  });

  it('navigates to the next slide', () => {
    render(<EcoCityCarousel cities={mockCities} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText('Eco City 2')).toBeInTheDocument();
  });

  it('navigates to the previous slide', () => {
    render(<EcoCityCarousel cities={mockCities} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    expect(screen.getByText('Eco City 1')).toBeInTheDocument();
  });
});