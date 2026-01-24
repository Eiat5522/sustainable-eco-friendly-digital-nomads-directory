/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditListingModal } from '../EditListingModal';

const fetchMock = jest.fn();

jest.mock('@/lib/client-utils', () => ({
  getUserFacingMessage: (error: unknown, fallback: string) => {
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  },
}));

jest.mock('../../../dashboard/components/VenueListingForm');

const { mockFormSubmission } = jest.requireMock('../../../dashboard/components/VenueListingForm');

describe('EditListingModal', () => {
  const onUpdatedMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    onUpdatedMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the edit button with listing name', () => {
    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const editButton = screen.getByTitle('Edit Test Venue');
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent('✎');
  });

  it('opens modal when edit button is clicked', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
    } as Response);

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Listing')).toBeInTheDocument();
    });

    expect(screen.getByText('Admin workspace')).toBeInTheDocument();
    expect(
      screen.getByText(/Update details, amenities, and sustainability highlights for Test Venue/)
    ).toBeInTheDocument();
  });

  it('fetches listing data when modal opens', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
    } as Response);

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/listings/manage/listing-123');
    });

    expect(screen.getByTestId('venue-form')).toBeInTheDocument();
  });

  it('displays loading state while fetching listing', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Loading listing details...')).toBeInTheDocument();
    });
  });

  it('displays error when fetching listing fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    } as Response);

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch listing')).toBeInTheDocument();
    });
  });

  it('handles network error when fetching listing', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('handles non-Error exceptions when fetching', async () => {
    fetchMock.mockRejectedValueOnce('string error');

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  it('saves listing and closes modal on success', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('venue-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/listings/manage/listing-123',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockFormSubmission),
        })
      );
    });

    expect(onUpdatedMock).toHaveBeenCalled();
  });

  it('displays error when save fails', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Update failed' }),
      } as Response);

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('venue-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });

    expect(onUpdatedMock).not.toHaveBeenCalled();
  });

  it('displays fallback error message when save fails without message', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('venue-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update listing')).toBeInTheDocument();
    });
  });

  it('handles JSON parse error when save fails', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('venue-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update listing')).toBeInTheDocument();
    });
  });

  it('handles network error when saving', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockRejectedValueOnce(new Error('Network error'));

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('venue-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('handles non-Error exceptions when saving', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockRejectedValueOnce('string error');

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('venue-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred while saving')).toBeInTheDocument();
    });
  });

  it('displays saving state on submit button', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockImplementation(() => new Promise(() => {}));

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('venue-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'trigger-save' })).toBeDisabled();
    });
  });

  it('closes modal and clears state when close button is clicked', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
    } as Response);

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('venue-form')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Edit Listing')).not.toBeInTheDocument();
    });
  });

  it('renders Listing details card header', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test Venue', city: 'bangkok', type: 'coworking' }),
    } as Response);

    render(
      <EditListingModal
        listingId="listing-123"
        listingName="Test Venue"
        onUpdated={onUpdatedMock}
      />
    );

    const user = userEvent.setup();
    const editButton = screen.getByTitle('Edit Test Venue');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Listing details')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Keep listing information up to date for the community.')
    ).toBeInTheDocument();
  });
});
