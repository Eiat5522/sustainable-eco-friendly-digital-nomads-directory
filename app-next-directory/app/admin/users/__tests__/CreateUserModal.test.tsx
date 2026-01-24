import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateUserModal } from '../CreateUserModal';

jest.mock('@/lib/client-utils', () => ({
  getUserFacingMessage: jest.fn((err: unknown, defaultMsg: string) => {
    if (err instanceof Error) {
      return err.message;
    }
    return defaultMsg;
  }),
}));

describe('CreateUserModal', () => {
  const mockOnUserCreated = jest.fn();

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the trigger button', () => {
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    expect(screen.getByRole('button', { name: /add new user/i })).toBeInTheDocument();
  });

  it('opens modal when trigger button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    const triggerButton = screen.getByRole('button', { name: /add new user/i });
    await user.click(triggerButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create New User')).toBeInTheDocument();
    expect(
      screen.getByText('Fill in the details below to create a new user account.')
    ).toBeInTheDocument();
  });

  it('renders all form fields', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    const triggerButton = screen.getByRole('button', { name: /add new user/i });
    await user.click(triggerButton);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('handles name input change', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    await user.type(nameInput, 'John Doe');

    expect(nameInput.value).toBe('John Doe');
  });

  it('handles email input change', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    await user.type(emailInput, 'john@example.com');

    expect(emailInput.value).toBe('john@example.com');
  });

  it('handles password input change', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    await user.type(passwordInput, 'password123');

    expect(passwordInput.value).toBe('password123');
  });

  it('handles role selection change', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
    await user.selectOptions(roleSelect, 'admin');

    expect(roleSelect.value).toBe('admin');
  });

  it('handles status selection change', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
    await user.selectOptions(statusSelect, 'pending');

    expect(statusSelect.value).toBe('pending');
  });

  it('renders all role options', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
    const options = Array.from(roleSelect.options).map((opt) => opt.value);

    expect(options).toEqual(['user', 'venueOwner', 'editor', 'admin', 'superAdmin']);
  });

  it('renders all status options', async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
    const options = Array.from(statusSelect.options).map((opt) => opt.value);

    expect(options).toEqual(['active', 'suspended', 'pending']);
  });

  it('submits form successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');

    const submitButton = screen.getByRole('button', { name: /create user/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnUserCreated).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'securepass123',
        role: 'user',
        status: 'active',
      }),
    });
  });

  it('displays error on failed submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already exists' }),
    });

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');

    const submitButton = screen.getByRole('button', { name: /create user/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    expect(mockOnUserCreated).not.toHaveBeenCalled();
  });

  it('displays generic error when no error message in response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');

    const submitButton = screen.getByRole('button', { name: /create user/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create user')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');

    const submitButton = screen.getByRole('button', { name: /create user/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    let resolvePromise: (value: unknown) => void;
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');

    const submitButton = screen.getByRole('button', { name: /create user/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();

    // Clean up: resolve the promise to avoid pending async work
    resolvePromise({ ok: true, json: async () => ({ success: true }) });
    await waitFor(() => {
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
    });
  });

  it('closes modal after successful submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');

    const submitButton = screen.getByRole('button', { name: /create user/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('resets form data after successful submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    // First submission
    await user.click(screen.getByRole('button', { name: /add new user/i }));
    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Open modal again
    await user.click(screen.getByRole('button', { name: /add new user/i }));

    // Check that form is reset
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Role') as HTMLSelectElement).value).toBe('user');
    expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe('active');
  });

  it('disables cancel button during submission', async () => {
    let resolvePromise: (value: unknown) => void;
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');

    const submitButton = screen.getByRole('button', { name: /create user/i });
    await user.click(submitButton);

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    // Clean up: resolve the promise to avoid pending async work
    resolvePromise({ ok: true, json: async () => ({ success: true }) });
    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).not.toBeDisabled();
    });
  });

  it('clears error on new submission', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'First error' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    // First submission with error
    await user.type(screen.getByLabelText('Name'), 'Jane Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'securepass123');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Second submission
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });

  it('submits form with custom role and status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const user = userEvent.setup();
    render(<CreateUserModal onUserCreated={mockOnUserCreated} />);

    await user.click(screen.getByRole('button', { name: /add new user/i }));

    await user.type(screen.getByLabelText('Name'), 'Admin User');
    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'adminpass123');
    await user.selectOptions(screen.getByLabelText('Role'), 'superAdmin');
    await user.selectOptions(screen.getByLabelText('Status'), 'pending');

    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(mockOnUserCreated).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpass123',
        role: 'superAdmin',
        status: 'pending',
      }),
    });
  });
});
