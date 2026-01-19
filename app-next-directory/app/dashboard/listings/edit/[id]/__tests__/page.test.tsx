/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();
const updateListingMock = jest.fn();
const getListingFormOptionsMock = jest.fn();
const getManagedListingMock = jest.fn();
const authMock = jest.fn();

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('../../../actions', () => ({
  updateListingAction: (...args: unknown[]) => updateListingMock(...args),
}));

jest.mock('@/lib/data-access/listing-form-options.dal', () => ({
  getListingFormOptions: () => getListingFormOptionsMock(),
}));

jest.mock('@/lib/data-access/listing-management.dal', () => ({
  getManagedListingForEdit: (...args: unknown[]) => getManagedListingMock(...args),
}));

jest.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => authMock(...args),
}));

jest.mock('../../../../components/VenueListingForm');

const { mockFormSubmission } = jest.requireMock('../../../../components/VenueListingForm');

describe('EditListingPage', () => {
  const getPageContent = async () => (await import('../page')).EditListingContent;

  beforeEach(() => {
    pushMock.mockReset();
    updateListingMock.mockReset();
    getListingFormOptionsMock.mockReset();
    getManagedListingMock.mockReset();
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'owner-1', role: 'venueOwner' },
    });
    getListingFormOptionsMock.mockResolvedValue({
      cities: [],
      ecoTags: [],
      digitalNomadFeatures: [],
      amenities: [],
    });
  });

  it('shows error when user is not authenticated', async () => {
    const Page = await getPageContent();
    authMock.mockResolvedValue(null);

    const view = await Page({ params: { id: 'listing-1' } });
    render(view);

    await screen.findByText(
      'Unable to load this listing. Please check the link or contact support.'
    );
  });

  it('loads the listing details and saves updates', async () => {
    const Page = await getPageContent();
    const user = userEvent.setup();

    getManagedListingMock.mockResolvedValue({ name: 'Original Listing' });
    updateListingMock.mockResolvedValue({ success: true });

    const view = await Page({ params: { id: 'listing-1' } });
    render(view);

    await screen.findByText('Edit Listing');
    expect(screen.getByTestId('listing-name')).toHaveTextContent('Original Listing');

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    await waitFor(() =>
      expect(updateListingMock).toHaveBeenCalledWith('listing-1', mockFormSubmission)
    );
    expect(pushMock).toHaveBeenCalledWith('/dashboard/listings');
  });

  it('shows an error message when the listing cannot be loaded', async () => {
    const Page = await getPageContent();

    getManagedListingMock.mockResolvedValue(null);

    const view = await Page({ params: { id: 'listing-1' } });
    render(view);

    await screen.findByText(
      'Unable to load this listing. Please check the link or contact support.'
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
  it('shows sign-in prompt when user is not authenticated', async () => {
    const Page = await getPageContent();

    authMock.mockResolvedValue({ user: undefined });

    const view = await Page({ params: { id: 'listing-1' } });
    render(view);

    await screen.findByText('Please sign in to edit listings.');
    expect(getManagedListingMock).not.toHaveBeenCalled();
  });

  it('surfaces save errors returned by the API', async () => {
    const Page = await getPageContent();
    const user = userEvent.setup();

    getManagedListingMock.mockResolvedValue({ name: 'Original Listing' });
    updateListingMock.mockRejectedValue(new Error('Failed to update listing'));

    const view = await Page({ params: { id: 'listing-1' } });
    render(view);
    await screen.findByText('Edit Listing');

    await user.click(screen.getByRole('button', { name: /trigger-save/i }));

    await screen.findByText('Failed to update listing');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
