import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetRequestPage from '../page';

const fetchMock = jest.fn();

jest.mock('next/navigation', () => ({ useSearchParams: jest.fn() }));

describe('ResetRequestPage', () => {
  const originalError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('normalizes the email and shows confirmation on success', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });

    render(<ResetRequestPage />);

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: ' Test@Example.COM  ' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/reset link has been sent/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
  });

  it('prevents submission when email is empty after trimming', async () => {
    render(<ResetRequestPage />);

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: '   ' },
    });

    const form = screen.getByRole('button', { name: /send reset link/i }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an error message when the request fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    render(<ResetRequestPage />);

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalledWith(
      'Password reset request failed:',
      expect.any(Error)
    );
  });
});
