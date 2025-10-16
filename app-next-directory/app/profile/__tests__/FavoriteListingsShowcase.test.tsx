import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { FavoriteListingsShowcase } from '../FavoriteListingsShowcase';
import type { FavoriteListing } from '../utils';

describe('FavoriteListingsShowcase', () => {
  const baseListing: FavoriteListing = {
    id: 'listing-1',
    name: 'Eco Workspace',
    slug: 'eco-workspace',
    city: 'Lisbon',
    country: 'Portugal',
    type: 'coworking',
    category: 'coworking',
    shortDescription: 'Bright eco-conscious coworking space.',
    priceRange: 'budget',
    ecoFocusTags: ['Solar panels', 'Organic coffee'],
    digitalNomadFeatures: ['Fast WiFi', 'Community events'],
    image: {
      url: 'https://cdn.test/workspace.jpg',
      width: 1200,
      height: 900,
      alt: 'Workspace image',
    },
    createdAt: '2024-01-10T00:00:00.000Z',
  };

  // Removed unnecessary global fake timers and setSystemTime

  it('returns null when there are no listings', () => {
    const { container } = render(<FavoriteListingsShowcase listings={[]} onRemove={jest.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders listing information and triggers removal', () => {
    const onRemove = jest.fn();
    render(<FavoriteListingsShowcase listings={[baseListing]} onRemove={onRemove} />);

    expect(screen.getByRole('heading', { name: 'Eco Workspace' })).toBeInTheDocument();
    expect(screen.getByText('Coworking Space')).toBeInTheDocument();
    expect(screen.getByText('Budget Friendly')).toBeInTheDocument();
    expect(screen.getByText('Lisbon, Portugal')).toBeInTheDocument();
    expect(screen.getByText('Saved Jan 10, 2024')).toBeInTheDocument();
    expect(screen.getAllByText('Bright eco-conscious coworking space.')).toHaveLength(2);

    const removeButton = screen.getByRole('button', { name: /remove eco workspace/i });
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('listing-1');
  });

  it('expands and collapses details for a listing', () => {
    render(<FavoriteListingsShowcase listings={[baseListing]} onRemove={jest.fn()} />);

    const toggleButton = screen.getByRole('button', { name: /view details/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Why we love it/i)).toBeVisible();

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('handles listings without images or recognised labels', () => {
    const customListing: FavoriteListing = {
      ...baseListing,
      id: 'listing-2',
      name: 'Forest Retreat',
      image: undefined,
      category: 'eco-lodge',
      priceRange: undefined,
      ecoFocusTags: ['Rainwater harvesting'],
      digitalNomadFeatures: ['Retreat programs'],
    };

    render(<FavoriteListingsShowcase listings={[customListing]} onRemove={jest.fn()} />);

    expect(screen.getByText('Forest Retreat')).toBeInTheDocument();
    // Falls back to friendly label formatting
    expect(screen.getByText('Eco Lodge')).toBeInTheDocument();
    // Displays highlight tags from both eco and digital feature sources
    expect(screen.getAllByText('Rainwater harvesting').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Retreat programs').length).toBeGreaterThan(0);
  });
});

