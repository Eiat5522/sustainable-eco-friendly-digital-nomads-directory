import { act, fireEvent, render, screen } from '@testing-library/react';
import { ProfileEditForm } from '../ProfileEditForm';

const originalFetch = global.fetch;

describe('ProfileEditForm component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('prefills the current name and allows cancel', () => {
    const onCancel = jest.fn();

    render(<ProfileEditForm currentName="Ada Lovelace" onCancel={onCancel} />);

    expect(screen.getByDisplayValue('Ada Lovelace')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('uses default props when none are provided', () => {
    render(<ProfileEditForm />);

    expect(screen.getByLabelText(/full name/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
  });

  it('submits the trimmed name and shows success feedback', async () => {
    const onSuccess = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<ProfileEditForm currentName="  Ada " onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: '  Grace Hopper  ' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Grace Hopper' }),
      credentials: 'include',
      signal: expect.any(AbortSignal),
    });

    expect(await screen.findByText(/profile updated successfully/i)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('can succeed without triggering optional callbacks', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<ProfileEditForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Alan Turing' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Profile updated successfully');
  });

  it('surfaces API validation errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'Failed to update profile' } }),
    });

    render(<ProfileEditForm currentName="Sam" />);

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to update profile');
  });

  it('falls back to default error when response body cannot be parsed', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockRejectedValue(new Error('bad json')),
    });

    render(<ProfileEditForm currentName="Sam" />);

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to update profile');
  });

  it('shows a generic error when an unknown issue occurs', async () => {
    (global.fetch as jest.Mock).mockRejectedValue('network-bubble');

    render(<ProfileEditForm currentName="Sam" />);

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('An error occurred');
  });

  it('handles aborted requests gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      (_input: RequestInfo, init?: RequestInit) =>
        new Promise((_, reject) => {
          const signal = init?.signal as AbortSignal | undefined;
          signal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        })
    );

    render(<ProfileEditForm currentName="Sam" />);

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /save changes/i }));
      jest.advanceTimersByTime(10000);
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Request timed out');
  });
});
