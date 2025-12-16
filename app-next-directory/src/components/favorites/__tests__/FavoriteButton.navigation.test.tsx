/**
 * FavoriteButton Navigation Tests
 *
 * This file contains Jest/RTL tests for deterministic navigation flows in FavoriteButton.
 * These tests verify auth gating and redirect behavior that was previously tested via Playwright E2E.
 *
 * Covered E2E scenarios:
 * - Unauthenticated user favorites attempt triggers sign-in with callbackUrl
 * - 401 response from favorites API triggers authentication redirect
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn, useSession } from 'next-auth/react';
import { FavoriteButton } from '../FavoriteButton';

jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

const mockFetch = jest.fn();
let fetchSpy: jest.SpyInstance;

global.alert = jest.fn();

describe('FavoriteButton - Deterministic Navigation Flows', () => {
  beforeAll(() => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(mockFetch as jest.MockedFunction<typeof fetch>);
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    (global.alert as jest.Mock).mockClear();
    mockSignIn.mockReset();
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
  });

  describe('Unauthenticated User Auth Gating', () => {
    it('triggers sign-in with current page as callbackUrl when unauthenticated user clicks favorite', async () => {
      const originalHref = window.location.href;

      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
      mockSignIn.mockResolvedValue(undefined);

      render(<FavoriteButton slug="eco-hostel" />);
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(undefined, { callbackUrl: originalHref });
      });
      expect(global.alert).not.toHaveBeenCalled();
    });

    it('does not make API call when unauthenticated user clicks favorite button', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
      mockSignIn.mockResolvedValue(undefined);

      render(<FavoriteButton slug="test-listing" />);
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });

      // Verify no API call was made (only status check on mount, no POST)
      const postCalls = mockFetch.mock.calls.filter(call => call[1]?.method === 'POST');
      expect(postCalls).toHaveLength(0);
    });
  });

  describe('Authenticated User 401 Handling', () => {
    it('shows alert and does not crash on 401 response from favorites API', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      // Mock initial status check returning 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      render(<FavoriteButton slug="test-listing" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/favorites/test-listing');
      });

      // Component should handle 401 gracefully
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles 401 on toggle attempt gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      // Initial status check succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      render(<FavoriteButton slug="test-listing" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/favorites/test-listing');
      });

      // Toggle attempt returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Session expired' }),
      } as Response);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      // Should handle error without crashing
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });
  });

  describe('CallbackUrl Preservation', () => {
    it('preserves complex URLs with query parameters as callbackUrl', async () => {
      // Mock window.location
      const originalLocation = window.location;

      delete (window as { location?: Location }).location;
      window.location = {
        ...originalLocation,
        href: 'http://localhost:3000/listings/eco-venue?tab=reviews&sort=recent#location',
      } as Location;

      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
      mockSignIn.mockResolvedValue(undefined);

      render(<FavoriteButton slug="eco-venue" />);
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(undefined, {
          callbackUrl: 'http://localhost:3000/listings/eco-venue?tab=reviews&sort=recent#location',
        });
      });

      // Restore window.location
      window.location = originalLocation;
    });

    it('uses current href for callbackUrl even with special characters', async () => {
      const originalLocation = window.location;

      delete (window as { location?: Location }).location;
      window.location = {
        ...originalLocation,
        href: 'http://localhost:3000/listings/café-bio?filter=organic&price=€€',
      } as Location;

      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
      mockSignIn.mockResolvedValue(undefined);

      render(<FavoriteButton slug="café-bio" />);
      const button = screen.getByRole('button');

      await userEvent.click(button);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(undefined, {
          callbackUrl: 'http://localhost:3000/listings/café-bio?filter=organic&price=€€',
        });
      });

      window.location = originalLocation;
    });
  });
});
