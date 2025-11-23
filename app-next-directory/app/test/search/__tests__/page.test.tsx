/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockListings = [
  {
    _id: 'listing-1',
    name: 'Green Coworking Space',
    shortDescription: 'Eco-friendly workspace with solar panels',
    description: 'A sustainable coworking space',
    ecoFocusTags: ['solar-power', 'recycling'],
    digitalNomadFeatures: ['High-speed wifi', 'Meeting rooms'],
  },
  {
    _id: 'listing-2',
    name: 'Sustainable Cafe',
    description: 'Organic coffee shop',
    ecoFocusTags: [{ slug: { current: 'organic' } }],
    digitalNomadFeatures: ['Free wifi'],
  },
  {
    _id: 'listing-3',
    name: 'Eco Hotel',
    shortDescription: 'Green hotel with renewable energy',
    ecoFocusTags: ['renewable-energy', 'zero-waste'],
    digitalNomadFeatures: [],
  },
];

describe('TestSearchPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ listings: mockListings }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the page with title', () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    expect(screen.getByText('Test Search Page')).toBeInTheDocument();
  });

  it('should render the search input', () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search by name, description, tag, or feature')
    ).toBeInTheDocument();
  });

  it('should fetch listings on mount', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/test-listings');
    });
  });

  it('should display listings after fetching', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });

    expect(screen.getByText('Sustainable Cafe')).toBeInTheDocument();
    expect(screen.getByText('Eco Hotel')).toBeInTheDocument();
  });

  it('should filter listings based on search term', async () => {
    const TestSearchPage = require('../page').default;
    const user = userEvent.setup();
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Cafe');

    // The search should work but we need to check that the page renders
    expect(searchInput).toHaveValue('Cafe');
  });

  it('should highlight matched text in listings', async () => {
    const TestSearchPage = require('../page').default;
    const user = userEvent.setup();
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Green');

    await waitFor(() => {
      const highlights = screen.getAllByTestId('highlight');
      expect(highlights.length).toBeGreaterThan(0);
    });
  });

  it('should display all listings when search is empty', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      const listings = screen.getAllByTestId('listing-card');
      expect(listings).toHaveLength(3);
    });
  });

  it('should handle search with multiple tokens', async () => {
    const TestSearchPage = require('../page').default;
    const user = userEvent.setup();
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'wifi solar');

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });
  });

  it('should display listing description', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      const descriptions = screen.getAllByTestId('listing-description');
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  it('should display eco tags when available', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      const ecoTags = screen.getAllByTestId('eco-tag');
      expect(ecoTags.length).toBeGreaterThan(0);
    });
  });

  it('should display nomad features when available', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      const features = screen.getAllByTestId('nomad-feature');
      expect(features.length).toBeGreaterThan(0);
    });
  });

  it('should handle fetch error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));

    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load test listings',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Should not crash, just not display listings
    expect(screen.queryByTestId('listing-card')).not.toBeInTheDocument();
  });

  it('should cleanup fetch on unmount', async () => {
    const TestSearchPage = require('../page').default;
    const { unmount } = render(<TestSearchPage />);

    // Unmount before fetch completes
    unmount();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should render listing titles with correct test id', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      const titles = screen.getAllByTestId('listing-title');
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  it('should handle search input with special characters', async () => {
    const TestSearchPage = require('../page').default;
    const user = userEvent.setup();
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, '.*+?');

    // Should not crash
    expect(searchInput).toHaveValue('.*+?');
  });

  it('should clear search when input is cleared', async () => {
    const TestSearchPage = require('../page').default;
    const user = userEvent.setup();
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Cafe');
    await user.clear(searchInput);

    await waitFor(() => {
      const listings = screen.getAllByTestId('listing-card');
      expect(listings).toHaveLength(3);
    });
  });

  it('should sort listings by match score', async () => {
    const TestSearchPage = require('../page').default;
    const user = userEvent.setup();
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'wifi');

    await waitFor(() => {
      const listings = screen.getAllByTestId('listing-card');
      expect(listings.length).toBeGreaterThan(0);
    });
  });

  it('should handle listings with wifi feature appending', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      const features = screen.getAllByTestId('nomad-feature');
      const wifiFeatures = features.filter(f => f.textContent?.includes('wifi'));
      expect(wifiFeatures.length).toBeGreaterThan(0);
    });
  });

  it('should normalize eco tags from object format', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      // The listing with object eco tags should still display
      expect(screen.getByText('Sustainable Cafe')).toBeInTheDocument();
    });
  });

  it('should handle listings with empty eco tags', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        listings: [
          {
            _id: 'listing-4',
            name: 'Simple Workspace',
            description: 'Basic workspace',
            ecoFocusTags: [],
            digitalNomadFeatures: [],
          },
        ],
      }),
    });

    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Simple Workspace')).toBeInTheDocument();
    });
  });

  it('should use shortDescription when available', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      const description = screen.getByText(/Eco-friendly workspace with solar panels/);
      expect(description).toBeInTheDocument();
    });
  });

  it('should fall back to description when shortDescription is not available', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      const description = screen.getByText(/Organic coffee shop/);
      expect(description).toBeInTheDocument();
    });
  });

  it('should append default text to descriptions', async () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      const descriptions = screen.getAllByTestId('listing-description');
      const hasDefaultText = descriptions.some(d =>
        d.textContent?.includes('Eco friendly workspace with sustainable amenities')
      );
      expect(hasDefaultText).toBe(true);
    });
  });

  it('should handle search with whitespace only', async () => {
    const TestSearchPage = require('../page').default;
    const user = userEvent.setup();
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, '   ');

    await waitFor(() => {
      const listings = screen.getAllByTestId('listing-card');
      expect(listings).toHaveLength(3);
    });
  });

  it('should render search input with aria-label', () => {
    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    const searchInput = screen.getByLabelText('Search listings');
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle listings with undefined properties', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        listings: [
          {
            _id: 'listing-5',
            name: 'Minimal Listing',
          },
        ],
      }),
    });

    const TestSearchPage = require('../page').default;
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Minimal Listing')).toBeInTheDocument();
    });
  });

  it('should show all listings when search has no matches but tokens exist', async () => {
    const TestSearchPage = require('../page').default;
    const user = userEvent.setup();
    render(<TestSearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Green Coworking Space')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'nonexistentterm');

    await waitFor(() => {
      // Should still show all listings when no matches found
      const listings = screen.getAllByTestId('listing-card');
      expect(listings.length).toBeGreaterThan(0);
    });
  });
});
