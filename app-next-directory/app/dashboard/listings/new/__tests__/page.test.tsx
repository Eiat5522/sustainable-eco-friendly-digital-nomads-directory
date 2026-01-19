/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();
const createListingMock = jest.fn();
const getListingFormOptionsMock = jest.fn();
const authMock = jest.fn();

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('../../actions', () => ({
  createListingAction: (...args: unknown[]) => createListingMock(...args),
}));

jest.mock('@/lib/data-access/listing-form-options.dal', () => ({
  getListingFormOptions: () => getListingFormOptionsMock(),
}));

jest.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => authMock(...args),
}));

jest.mock('../../../components/VenueListingForm');

const { mockFormSubmission } = jest.requireMock('../../../components/VenueListingForm');

describe('NewListingPage', () => {
  const getPage = async () => (await import('../page')).default;

  beforeEach(() => {
    pushMock.mockReset();
    createListingMock.mockReset();
    getListingFormOptionsMock.mockReset();
    authMock.mockReset();
    getListingFormOptionsMock.mockResolvedValue({
      cities: [],
      ecoTags: [],
      digitalNomadFeatures: [],
      amenities: [],
    });
    authMock.mockResolvedValue({ user: { id: 'owner-1' } });
  });

  it('shows sign-in prompt when user is not authenticated', async () => {
    authMock.mockResolvedValueOnce({ user: undefined });

    const Page = await getPage();
    const view = await Page();
    render(view);

    expect(screen.getByText('Please sign in to create listings.')).toBeInTheDocument();
  });

  it('creates a new listing and navigates back to the listings dashboard on success', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    createListingMock.mockResolvedValueOnce({ id: 'listing-1' });

    const view = await Page();
    render(view);

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    expect(createListingMock).toHaveBeenCalledWith(mockFormSubmission);
    expect(pushMock).toHaveBeenCalledWith('/dashboard/listings');
  });

  it('surfaces API errors when creation fails', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    createListingMock.mockRejectedValueOnce(new Error('Failed to create listing'));

    const view = await Page();
    render(view);

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    expect(await screen.findByText('Failed to create listing')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the thrown error is not an Error instance', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    createListingMock.mockRejectedValueOnce('boom');

    const view = await Page();
    render(view);

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    expect(await screen.findByText('Failed to create listing')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
