/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('../../../components/VenueListingForm');

const { mockFormSubmission } = jest.requireMock('../../../components/VenueListingForm');

describe('NewListingPage', () => {
  const getPage = async () => (await import('../page')).default;

  beforeEach(() => {
    pushMock.mockReset();
    (global as any).fetch = jest.fn();
  });

  it('creates a new listing and navigates back to the listings dashboard on success', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'listing-1' }),
    });

    render(<Page />);

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/listings/manage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockFormSubmission),
      })
    );
    expect(pushMock).toHaveBeenCalledWith('/dashboard/listings');
  });

  it('surfaces API errors when creation fails', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'nope' }),
    });

    render(<Page />);

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    expect(await screen.findByText('Failed to create listing')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the thrown error is not an Error instance', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValueOnce('boom');

    render(<Page />);

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    expect(await screen.findByText('Failed to create listing')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
