/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();
const fetchMock = jest.fn();

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('../../../../dashboard/components/VenueListingForm');

const { mockFormSubmission } = jest.requireMock(
  '../../../../dashboard/components/VenueListingForm'
);

describe('AdminNewListingPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getPage = async () => (await import('../page')).default;

  it('renders the new listing form', async () => {
    const Page = await getPage();
    render(<Page />);

    expect(screen.getByText('Admin workspace')).toBeInTheDocument();
    expect(screen.getByText('Add New Listing')).toBeInTheDocument();
    expect(
      screen.getByText('Create listings on behalf of venue owners and contributors.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('venue-form')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to listings' })).toBeInTheDocument();
  });

  it('creates a new listing and navigates to admin listings page on success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'listing-123' }),
    } as Response);

    const Page = await getPage();
    const user = userEvent.setup();
    render(<Page />);

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/listings/manage',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockFormSubmission),
        })
      );
    });

    expect(pushMock).toHaveBeenCalledWith('/admin/listings');
  });

  it('displays error message when creation fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to create listing' }),
    } as Response);

    const Page = await getPage();
    const user = userEvent.setup();
    render(<Page />);

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create listing')).toBeInTheDocument();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it('displays error message when network request fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const Page = await getPage();
    const user = userEvent.setup();
    render(<Page />);

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it('handles non-Error exceptions with fallback message', async () => {
    fetchMock.mockRejectedValueOnce('string error');

    const Page = await getPage();
    const user = userEvent.setup();
    render(<Page />);

    const saveButton = screen.getByRole('button', { name: 'trigger-save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create listing')).toBeInTheDocument();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it('displays Listing details card with correct description', async () => {
    const Page = await getPage();
    render(<Page />);

    expect(screen.getByText('Listing details')).toBeInTheDocument();
    expect(
      screen.getByText('Fill in the essentials so the listing is ready for review.')
    ).toBeInTheDocument();
  });
});
