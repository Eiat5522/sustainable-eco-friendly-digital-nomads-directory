import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/auth/callbackUrl', () => ({
  sanitizeCallbackUrl: jest.fn((url: string | null) => url),
}));

const signInMock = jest.requireMock('next-auth/react').signIn as jest.Mock;
const useRouterMock = jest.requireMock('next/navigation').useRouter as jest.Mock;
const useSearchParamsMock = jest.requireMock('next/navigation').useSearchParams as jest.Mock;
const sanitizeCallbackUrlMock = jest.requireMock('@/lib/auth/callbackUrl').sanitizeCallbackUrl as jest.Mock;

const buildSearchParams = (params: Record<string, string> = {}) => ({
  get: (key: string) => params[key] ?? null,
});

describe('LoginForm', () => {
  beforeEach(() => {
    signInMock.mockReset();
    sanitizeCallbackUrlMock.mockReset();
    useRouterMock.mockReturnValue({ replace: jest.fn() });
    useSearchParamsMock.mockReturnValue(buildSearchParams());
  });

  it('validates email and password inputs before submission', async () => {
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), 'short');
    const submit = screen.getByRole('button', { name: /login/i });
    await user.click(submit);
    await waitFor(() => {
      expect(signInMock).not.toHaveBeenCalled();
    });
  });

  it('displays mapped error messages from query parameters', async () => {
    useSearchParamsMock.mockReturnValue(
      buildSearchParams({ error: 'CredentialsSignin' }),
    );

    render(<LoginForm />);

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('submits credentials and navigates using sanitized callback url', async () => {
    useSearchParamsMock.mockReturnValue(
      buildSearchParams({ callbackUrl: '/dashboard' }),
    );
    sanitizeCallbackUrlMock.mockReturnValue('/dashboard');
    const routerReplace = jest.fn();
    useRouterMock.mockReturnValue({ replace: routerReplace });

    signInMock.mockResolvedValue({
      error: null,
      url: '/dashboard',
    });

    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('credentials', {
        email: 'user@example.com',
        password: 'supersecret',
        redirect: false,
        callbackUrl: '/dashboard',
      });
    });
    expect(routerReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('shows backend errors returned from signIn', async () => {
    signInMock.mockResolvedValue({ error: 'CredentialsSignin' });

    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
