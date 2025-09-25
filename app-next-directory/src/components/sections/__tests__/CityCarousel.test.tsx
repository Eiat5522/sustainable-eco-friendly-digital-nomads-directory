import { render, screen, fireEvent } from '@testing-library/react';
import EcoCityCarousel from '@/components/cities/EcoCityCarousel';

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

    // Test that the carousel renders and shows the first city by default
    expect(screen.getByText('Eco City 1')).toBeInTheDocument();
    // Verify the carousel component itself is rendered
    expect(screen.getByRole('region')).toBeInTheDocument(); // or adjust to the actual carousel role
  });
    expect(screen.getByRole('region')).toBeInTheDocument(); // or adjust to the actual carousel role
  });
    expect(screen.getByRole('region')).toBeInTheDocument(); // or adjust to the actual carousel role
  });
    expect(screen.getByRole('region')).toBeInTheDocument(); // or adjust to the actual carousel role
  });
    expect(screen.getByRole('region')).toBeInTheDocument(); // or adjust to the actual carousel role
  });

  it('navigates to the next slide', () => {
    render(<EcoCityCarousel cities={mockCities} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Wait for navigation to complete and verify the active slide
    expect(screen.getByText('Eco City 2')).toBeInTheDocument();
    // Optionally verify first city is no longer the active slide
  });

  it('navigates to the previous slide', () => {
    render(<EcoCityCarousel cities={mockCities} />);

    // First navigate to the second slide
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    expect(screen.getByText('Eco City 2')).toBeInTheDocument();
    
    // Then navigate back to the first slide
    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    expect(screen.getByText('Eco City 1')).toBeInTheDocument();
  });
});