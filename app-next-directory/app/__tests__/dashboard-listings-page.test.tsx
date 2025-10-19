import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

const redirectMock = jest.fn();
const managementSpy = jest.fn(() => <div data-testid="venue-management">Venue Management</div>);

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('../dashboard/components/VenueListingManagement', () => ({
    VenueListingManagement: (...args: unknown[]) => managementSpy(...args),
  }),
  { virtual: true }
);

beforeEach(() => {
  redirectMock.mockReset();
  managementSpy.mockClear();
});

describe('VenueListingsPage', () => {
  it('renders management interface for venue owners', async () => {
    redirectMock.mockImplementation(() => {
      throw new Error('redirect should not be invoked');
    });

    jest.resetModules();
    const [pageModule, authModule] = await Promise.all([
      import('../dashboard/listings/page'),
      import('@/lib/auth'),
    ]);

    const auth = authModule.auth as jest.Mock;
    auth.mockResolvedValue({ user: { id: 'owner-1', role: 'venueOwner' } });

    const element = await pageModule.default();
    render(element);

    expect(screen.getByText('Manage Your Listings')).toBeInTheDocument();
    expect(screen.getByTestId('venue-management')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects non-owners back to dashboard', async () => {
    redirectMock.mockImplementation(() => {
      const error = new Error('REDIRECT');
      (error as Error & { digest?: string }).digest = 'NEXT_REDIRECT';
      throw error;
    });

    jest.resetModules();
    const [pageModule, authModule] = await Promise.all([
      import('../dashboard/listings/page'),
      import('@/lib/auth'),
    ]);

    const auth = authModule.auth as jest.Mock;
    auth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });

    await expect(pageModule.default()).rejects.toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
    expect(managementSpy).not.toHaveBeenCalled();
  });
});
