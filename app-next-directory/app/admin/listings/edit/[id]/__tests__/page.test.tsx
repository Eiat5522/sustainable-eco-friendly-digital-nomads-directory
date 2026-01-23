/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();
const fetchMock = jest.fn();
const paramsMock = { id: 'listing-123' };

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({
    push: pushMock,
  }),
  useParams: () => paramsMock,
}));

jest.mock('../../../../../dashboard/components/VenueListingForm');

const { mockFormSubmission } = jest.requireMock('../../../../../dashboard/components/VenueListingForm');

describe('AdminEditListingPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    paramsMock.id = 'listing-123';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getPage = async () => (await import('../page')).default;

  it('fetches and displays the listing for editing', async () => {
    paramsMock.id = 'listing-123';
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Existing Listing', city: 'bangkok', type: 'coworking' }),
    } as Response);

    const Page = await getPage();
    render(<Page />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/listings/manage/listing-123');
      expect(screen.getByTestId('listing-name')).toHaveTextContent('Existing Listing');
    });
  });

  it('renders page header and navigation', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test Listing', city: 'test', type: 'cafe' }),
    } as Response);

    const Page = await getPage();
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Admin workspace')).toBeInTheDocument();
    });

    expect(screen.getByText('Edit Listing')).toBeInTheDocument();
    expect(screen.getByText('Update details, amenities, and sustainability highlights.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to listings' })).toBeInTheDocument();
  });

  it('updates the listing and navigates to admin listings page on success', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Original Listing', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'listing-123' }),
      } as Response);

    const Page = await getPage();
    const user = userEvent.setup();
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('listing-name')).toBeInTheDocument();
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

    expect(pushMock).toHaveBeenCalledWith('/admin/listings');
  });

  it('displays error when fetching listing fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Listing not found' }),
    } as Response);

    const Page = await getPage();
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch listing')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('venue-form')).not.toBeInTheDocument();
  });

  it('displays error when update fails', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Original Listing', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      } as Response);

    const Page = await getPage();
    const user = userEvent.setup();
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('listing-name')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update listing/)).toBeInTheDocument();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it('shows loading state while fetching', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));

    const Page = await getPage();
    render(<Page />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles network error when fetching listing', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const Page = await getPage();
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('handles non-Error exceptions during fetch', async () => {
    fetchMock.mockRejectedValueOnce('string error');

    const Page = await getPage();
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Error: An unexpected error occurred')).toBeInTheDocument();
    });
  });

  it('handles network error when updating listing', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Original Listing', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockRejectedValueOnce(new Error('Network error'));

    const Page = await getPage();
    const user = userEvent.setup();
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('listing-name')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('handles non-Error exceptions during update', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Original Listing', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockRejectedValueOnce('string error');

    const Page = await getPage();
    const user = userEvent.setup();
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('listing-name')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/An error occurred while saving/)).toBeInTheDocument();
    });
  });

  it('displays saving state on submit button', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Original Listing', city: 'bangkok', type: 'coworking' }),
      } as Response)
      .mockImplementation(() => new Promise(() => {}));

    const Page = await getPage();
    const user = userEvent.setup();
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('listing-name')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'trigger-save' })).toBeDisabled();
    });
  });

  it('handles array id parameter', async () => {
    paramsMock.id = ['listing-array-123'] as unknown as string;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Array ID Listing', city: 'test', type: 'cafe' }),
    } as Response);

    const Page = await getPage();
    render(<Page />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/listings/manage/listing-array-123');
    });
  });
});
