import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VenueListingForm } from '../VenueListingForm';

describe('VenueListingForm', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock | undefined)?.mockRestore?.();
    global.fetch = originalFetch;
  });

  const mockMetadataFetches = () => {
    const responses = [
      {
        ok: true,
        json: async () => ({ cities: [{ _id: 'city-1', name: 'City One' }] }),
      },
      {
        ok: true,
        json: async () => ({ ecoTags: [{ _id: 'tag-1', name: 'Solar Power' }] }),
      },
      {
        ok: true,
        json: async () => ({ digitalNomadFeatures: [{ _id: 'feature-1', name: 'Fast WiFi' }] }),
      },
      {
        ok: true,
        json: async () => ({ amenities: [{ _id: 'amenity-1', name: 'Air Conditioning' }] }),
      },
    ];

    (global.fetch as jest.Mock).mockImplementation(() => {
      const next = responses.shift();
      if (!next) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve(next);
    });
  };

  it('fetches city and tag metadata on mount', async () => {
    mockMetadataFetches();

    await act(async () => {
      render(<VenueListingForm />);
    });

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    const urls = (global.fetch as jest.Mock).mock.calls.map(([url]) => url);
    expect(urls).toEqual(
      expect.arrayContaining([
        '/api/cities',
        '/api/eco-tags',
        '/api/digital-nomad-features',
        '/api/amenities',
      ]),
    );
  });

  it('shows saving state when the form is submitting', async () => {
    mockMetadataFetches();
    await act(async () => {
      render(<VenueListingForm saving />);
    });
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
