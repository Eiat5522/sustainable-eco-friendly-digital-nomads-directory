import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPage from '../page';

const fetchMock = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => 'token-123'),
  })),
}));

describe('ResetPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValue({ ok: true });
  });

  it('disables submit when requirements are not met', () => {
    const { rerender } = render(<ResetPage />);
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();

    const useSearchParams = require('next/navigation').useSearchParams as jest.Mock;
    useSearchParams.mockReturnValueOnce({ get: () => '' });
    rerender(<ResetPage />);
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
  });

  it('submits the new password and shows success message', async () => {
    render(<ResetPage />);

    fireEvent.change(screen.getByPlaceholderText(/new password/i), {
      target: { value: 'newpassword' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'newpassword' },
    });

    const submitButton = screen.getByRole('button', { name: /reset password/i });
    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'token-123', password: 'newpassword' }),
    });

    expect(await screen.findByText(/your password has been reset/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login');
  });

  it('shows an error message when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });

    render(<ResetPage />);

    fireEvent.change(screen.getByPlaceholderText(/new password/i), {
      target: { value: 'newpassword' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'newpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired link/i)).toBeInTheDocument();
    });
  });
});
