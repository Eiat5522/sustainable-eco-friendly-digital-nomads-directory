import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EcoCityCarousel from '../../cities/CityCarousel';
import { client } from '@/lib/sanity/client';

// Mock Sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

// Mock the carousel component
jest.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children, setApi }: any) => {
    React.useEffect(() => {
      if (setApi) {
        const mockApi = {
          canScrollPrev: () => true,
          canScrollNext: () => true,
          selectedScrollSnap: () => 0,
          scrollPrev: jest.fn(),
          scrollNext: jest.fn(),
          scrollTo: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
        };
        setApi(mockApi);
      }
    }, [setApi]);
    return <div data-testid="carousel">{children}</div>;
  },
  CarouselContent: ({ children, className }: any) => (
    <div data-testid="carousel-content" className={className}>{children}</div>
  ),
  CarouselItem: ({ children, className }: any) => (
    <div data-testid="carousel-item" className={className}>{children}</div>
  ),
  CarouselNext: () => <button data-testid="carousel-next">Next</button>,
  CarouselPrevious: () => <button data-testid="carousel-prev">Previous</button>,
}));

const mockCities = [
  {
    _id: '1',
    name: 'Copenhagen',
    sustainabilityScore: 95,
    highlights: ['Carbon neutral by 2025', 'Excellent public transport', 'Green energy'],
    image: 'https://example.com/copenhagen.jpg',
  },
  {
    _id: '2',
    name: 'Amsterdam',
    sustainabilityScore: 90,
    highlights: ['Cycling infrastructure', 'Renewable energy', 'Green spaces'],
    image: 'https://example.com/amsterdam.jpg',
  },
  {
    _id: '3',
    name: 'Stockholm',
    sustainabilityScore: 88,
    highlights: ['Waste management', 'Clean water', 'Public parks'],
    image: 'https://example.com/stockholm.jpg',
  },
];

describe('CityCarousel (EcoCityCarousel)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading and Error States', () => {
    it('should display loading state initially', () => {
      (client.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
      render(<EcoCityCarousel />);
      
      expect(screen.getByText('Loading cities...')).toBeInTheDocument();
    });

    it('should display error state when fetch fails', async () => {
      (client.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/Failed to load cities/)).toBeInTheDocument();
      });
    });
  });

  describe('Styling and CSS Classes', () => {
    beforeEach(async () => {
      (client.fetch as jest.Mock).mockResolvedValue(mockCities);
    });

    it('should apply section wrapper styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const section = container.querySelector('section');
        expect(section).toHaveClass('py-24');
        expect(section).toHaveClass('bg-gradient-to-b');
        expect(section).toHaveClass('from-green-50/50');
        expect(section).toHaveClass('to-transparent');
      });
    });

    it('should apply container styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const containerDiv = container.querySelector('.container');
        expect(containerDiv).toHaveClass('container');
        expect(containerDiv).toHaveClass('mx-auto');
      });
    });

    it('should apply heading styles', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const heading = screen.getByText('Eco-Friendly Destinations');
        expect(heading).toHaveClass('text-3xl');
        expect(heading).toHaveClass('font-medium');
        expect(heading).toHaveClass('text-green-900');
        expect(heading).toHaveClass('md:text-4xl');
        expect(heading).toHaveClass('lg:text-5xl');
      });
    });

    it('should apply description text styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const description = container.querySelector('.text-green-700\\/80');
        expect(description).toHaveClass('max-w-lg');
      });
    });

    it('should apply navigation button styles', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const navButtons = buttons.filter(btn => 
          btn.querySelector('.size-5')
        );
        
        navButtons.forEach(button => {
          expect(button).toHaveClass('disabled:pointer-events-auto');
          expect(button).toHaveClass('hover:bg-green-100');
        });
      });
    });

    it('should apply carousel content responsive classes', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const content = screen.getByTestId('carousel-content');
        expect(content).toHaveClass('ml-0');
        expect(content.className).toContain('2xl:ml-[max(8rem,calc(50vw-700px))]');
        expect(content.className).toContain('2xl:mr-[max(0rem,calc(50vw-700px))]');
      });
    });

    it('should apply carousel item responsive classes', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const items = screen.getAllByTestId('carousel-item');
        items.forEach(item => {
          expect(item).toHaveClass('max-w-[320px]');
          expect(item).toHaveClass('pl-[20px]');
          expect(item).toHaveClass('lg:max-w-[360px]');
        });
      });
    });

    it('should apply card shadow and border styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const cards = container.querySelectorAll('.shadow-lg');
        expect(cards.length).toBeGreaterThan(0);
        cards.forEach(card => {
          expect(card).toHaveClass('overflow-hidden');
          expect(card).toHaveClass('border-0');
        });
      });
    });

    it('should apply image container styles with gradient overlay', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const imageContainers = container.querySelectorAll('.group.relative');
        imageContainers.forEach(imgContainer => {
          expect(imgContainer).toHaveClass('h-full');
          expect(imgContainer).toHaveClass('min-h-[27rem]');
          expect(imgContainer).toHaveClass('max-w-full');
          expect(imgContainer).toHaveClass('overflow-hidden');
          expect(imgContainer).toHaveClass('rounded-xl');
        });
      });
    });

    it('should apply image hover effect styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const images = container.querySelectorAll('img');
        images.forEach(img => {
          expect(img).toHaveClass('absolute');
          expect(img).toHaveClass('h-full');
          expect(img).toHaveClass('w-full');
          expect(img).toHaveClass('object-cover');
          expect(img).toHaveClass('object-center');
          expect(img).toHaveClass('transition-transform');
          expect(img).toHaveClass('duration-300');
          expect(img).toHaveClass('group-hover:scale-105');
        });
      });
    });

    it('should apply gradient overlay styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const gradients = container.querySelectorAll('.bg-gradient-to-b.from-black\\/0');
        gradients.forEach(gradient => {
          expect(gradient).toHaveClass('absolute');
          expect(gradient).toHaveClass('inset-0');
          expect(gradient).toHaveClass('h-full');
          expect(gradient).toHaveClass('via-black/40');
          expect(gradient).toHaveClass('to-black/80');
          expect(gradient).toHaveClass('mix-blend-multiply');
        });
      });
    });

    it('should apply badge styles with green color scheme', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const badges = container.querySelectorAll('.bg-green-600');
        badges.forEach(badge => {
          expect(badge).toHaveClass('hover:bg-green-700');
          expect(badge).toHaveClass('flex');
          expect(badge).toHaveClass('items-center');
          expect(badge).toHaveClass('gap-1');
          expect(badge).toHaveClass('px-3');
          expect(badge).toHaveClass('py-1.5');
          expect(badge).toHaveClass('text-white');
        });
      });
    });

    it('should apply city name text styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const cityName = screen.getByText('Copenhagen');
        expect(cityName).toHaveClass('mb-2');
        expect(cityName).toHaveClass('pt-4');
        expect(cityName).toHaveClass('text-xl');
        expect(cityName).toHaveClass('font-semibold');
        expect(cityName).toHaveClass('md:mb-3');
        expect(cityName).toHaveClass('md:pt-4');
        expect(cityName).toHaveClass('lg:pt-4');
      });
    });

    it('should apply highlight list styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const lists = container.querySelectorAll('ul.space-y-1');
        expect(lists.length).toBeGreaterThan(0);
      });
    });

    it('should apply highlight item bullet styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const bullets = container.querySelectorAll('.size-1\\.5.rounded-full.bg-green-400');
        expect(bullets.length).toBeGreaterThan(0);
      });
    });

    it('should apply explore button styles', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const exploreButtons = screen.getAllByText('Explore City');
        exploreButtons.forEach(button => {
          expect(button.closest('button')).toHaveClass('border-white/30');
          expect(button.closest('button')).toHaveClass('bg-black/20');
          expect(button.closest('button')).toHaveClass('text-white');
          expect(button.closest('button')).toHaveClass('hover:bg-black/40');
          expect(button.closest('button')).toHaveClass('hover:text-white');
        });
      });
    });

    it('should apply pagination dot styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const dots = container.querySelectorAll('button[aria-label^="Go to slide"]');
        dots.forEach(dot => {
          expect(dot).toHaveClass('h-2');
          expect(dot).toHaveClass('w-2');
          expect(dot).toHaveClass('rounded-full');
          expect(dot).toHaveClass('transition-colors');
        });
      });
    });

    it('should apply active pagination dot styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const activeDot = container.querySelector('.bg-green-600');
        expect(activeDot).toBeInTheDocument();
      });
    });

    it('should apply inactive pagination dot styles', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const inactiveDots = container.querySelectorAll('.bg-green-200');
        expect(inactiveDots.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Rendering', () => {
    beforeEach(() => {
      (client.fetch as jest.Mock).mockResolvedValue(mockCities);
    });

    it('should render all cities from Sanity', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        expect(screen.getByText('Copenhagen')).toBeInTheDocument();
        expect(screen.getByText('Amsterdam')).toBeInTheDocument();
        expect(screen.getByText('Stockholm')).toBeInTheDocument();
      });
    });

    it('should display sustainability scores', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        expect(screen.getByText('95/100')).toBeInTheDocument();
        expect(screen.getByText('90/100')).toBeInTheDocument();
        expect(screen.getByText('88/100')).toBeInTheDocument();
      });
    });

    it('should render highlights for each city', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        expect(screen.getByText('Carbon neutral by 2025')).toBeInTheDocument();
        expect(screen.getByText('Cycling infrastructure')).toBeInTheDocument();
        expect(screen.getByText('Waste management')).toBeInTheDocument();
      });
    });

    it('should render city images with correct alt text', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const copenhagenImg = screen.getByAltText('Copenhagen');
        expect(copenhagenImg).toHaveAttribute('src', 'https://example.com/copenhagen.jpg');
      });
    });

    it('should render correct number of pagination dots', async () => {
      const { container } = render(<EcoCityCarousel />);
      
      await waitFor(() => {
        const dots = container.querySelectorAll('button[aria-label^="Go to slide"]');
        expect(dots).toHaveLength(mockCities.length);
      });
    });
  });

  describe('Functionality', () => {
    beforeEach(() => {
      (client.fetch as jest.Mock).mockResolvedValue(mockCities);
    });

    it('should fetch cities on mount', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        expect(client.fetch).toHaveBeenCalledWith(
          expect.stringContaining('*[_type == "city"]')
        );
      });
    });

    it('should render carousel controls', async () => {
      render(<EcoCityCarousel />);
      
      await waitFor(() => {
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
      });
    });
  });
});
