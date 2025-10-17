/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();
let paramsValue: any = { id: 'listing-1' };

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ push: pushMock }),
  useParams: () => paramsValue,
}));

jest.mock('../../../../components/VenueListingForm');

const { mockFormSubmission } = jest.requireMock('../../../../components/VenueListingForm');

describe('EditListingPage', () => {
  const getPage = async () => (await import('../page')).default;

  beforeEach(() => {
    pushMock.mockReset();
    paramsValue = { id: 'listing-1' };
    (global as any).fetch = jest.fn();
  });

  it('loads the listing details and saves updates', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'Original Listing' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

    render(<Page />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await screen.findByText('Edit Listing');
    expect(screen.getByTestId('listing-name')).toHaveTextContent('Original Listing');

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/listings/manage/listing-1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify(mockFormSubmission),
    })));
    expect(pushMock).toHaveBeenCalledWith('/dashboard/listings');
  });

  it('shows an error message when the listing cannot be loaded', async () => {
    const Page = await getPage();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({}),
    });

    render(<Page />);

    await screen.findByText('Error: Failed to fetch listing');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('surfaces save errors returned by the API', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'Original Listing' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      });

    render(<Page />);
    await screen.findByText('Edit Listing');

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    await screen.findByText('Error: Failed to update listing');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('guards against missing listing identifiers during save attempts', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ name: 'Original Listing' }),
    });

    const view = render(<Page />);
    await screen.findByText('Edit Listing');

    paramsValue = { id: undefined };
    await act(async () => {
      view.rerender(<Page />);
    });

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    await screen.findByText('Error: Listing identifier is missing');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
