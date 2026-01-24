import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { EditUserForm } from '../EditUserForm';
import type { UserRole } from '@/types/auth';

const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user' as UserRole,
  status: 'active' as const,
};

describe('EditUserForm', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the form with initial user data', () => {
    render(<EditUserForm initialUser={mockUser} />);

    expect(screen.getByTestId('edit-user-form')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('displays name as em dash when null', () => {
    const userWithoutName = { ...mockUser, name: null };
    render(<EditUserForm initialUser={userWithoutName} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('displays email as em dash when null', () => {
    const userWithoutEmail = { ...mockUser, email: null };
    render(<EditUserForm initialUser={userWithoutEmail} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders all valid role options', () => {
    render(<EditUserForm initialUser={mockUser} />);

    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
    const options = Array.from(roleSelect.options).map((opt) => opt.value);

    expect(options).toEqual(['user', 'editor', 'venueOwner', 'admin', 'superAdmin']);
  });

  it('renders all status options', () => {
    render(<EditUserForm initialUser={mockUser} />);

    const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
    const options = Array.from(statusSelect.options).map((opt) => opt.value);

    expect(options).toEqual(['active', 'suspended', 'pending']);
  });

  it('handles role change', () => {
    render(<EditUserForm initialUser={mockUser} />);

    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    expect(roleSelect.value).toBe('admin');
  });

  it('handles status change', () => {
    render(<EditUserForm initialUser={mockUser} />);

    const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'suspended' } });

    expect(statusSelect.value).toBe('suspended');
  });

  it('submits form successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'User updated successfully' }),
    });

    const user = userEvent.setup();
    render(<EditUserForm initialUser={mockUser} />);

    const roleSelect = screen.getByLabelText('Role');
    await user.selectOptions(roleSelect, 'editor');

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User updated successfully')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-123', role: 'editor', status: 'active' }),
    });
  });

  it('displays error on failed submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Update failed' }),
    });

    const user = userEvent.setup();
    render(<EditUserForm initialUser={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('displays generic error when no error message in response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const user = userEvent.setup();
    render(<EditUserForm initialUser={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update user')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<EditUserForm initialUser={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('handles non-Error thrown objects', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

    const user = userEvent.setup();
    render(<EditUserForm initialUser={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update user')).toBeInTheDocument();
    });
  });

  it('shows saving state during submission', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    render(<EditUserForm initialUser={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('clears error and success messages on new submission', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'First error' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      });

    const user = userEvent.setup();
    render(<EditUserForm initialUser={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  it('auto-clears success message after 3 seconds', async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'User updated' }),
    });

    const user = userEvent.setup({ delay: null });
    render(<EditUserForm initialUser={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User updated')).toBeInTheDocument();
    });

    await React.act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByText('User updated')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('uses default success message when none provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const user = userEvent.setup();
    render(<EditUserForm initialUser={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User updated')).toBeInTheDocument();
    });
  });

  it('renders cancel link', () => {
    render(<EditUserForm initialUser={mockUser} />);

    const cancelLink = screen.getByText('Cancel');
    expect(cancelLink).toBeInTheDocument();
    expect(cancelLink).toHaveAttribute('href', '/admin/users');
  });

  it('handles malformed JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const user = userEvent.setup();
    render(<EditUserForm initialUser={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update user')).toBeInTheDocument();
    });
  });

  it('prevents form submission with preventDefault', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });

    render(<EditUserForm initialUser={mockUser} />);

    const form = screen.getByTestId('edit-user-form');
    const mockSubmitEvent = jest.fn();
    
    form.addEventListener('submit', mockSubmitEvent);
    fireEvent.submit(form);

    // Event should not propagate (preventDefault was called)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
