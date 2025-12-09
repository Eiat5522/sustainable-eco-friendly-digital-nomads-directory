import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
const sanitizeCallbackUrlMock = jest.requireMock('@/lib/auth/callbackUrl')
  .sanitizeCallbackUrl as jest.Mock;

const buildSearchParams = (params: Record<string, string> = {}) => ({
  get: (key: string) => params[key] ?? null,
});

describe('LoginForm', () => {
  jest.setTimeout(10000);

  beforeEach(() => {
    signInMock.mockReset();
    sanitizeCallbackUrlMock.mockReset().mockImplementation((value: string | null) => value);
    useRouterMock.mockReturnValue({ replace: jest.fn() });
    useSearchParamsMock.mockReturnValue(buildSearchParams());
  });

  it('validates email and password inputs before submission', async () => {
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), 'short');

    const submit = screen.getByRole('button', { name: /login/i });
    const form = submit.closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(await screen.findByText('Enter your password (min 8 characters).')).toBeInTheDocument();
    await waitFor(() => {
      expect(signInMock).not.toHaveBeenCalled();
    });
  });

  it.each([
    ['CredentialsSignin', /invalid email or password/i],
    ['OAuthAccountNotLinked', /linked to a different sign-in method/i],
    ['AccessDenied', /access denied/i],
    ['Configuration', /auth configuration issue/i],
    ['TotallyUnknown', /unable to sign in/i],
  ])('maps %s query error to the expected message', async (code, message) => {
    useSearchParamsMock.mockReturnValue(buildSearchParams({ error: code }));

    render(<LoginForm />);

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('submits credentials and navigates using sanitized callback url', async () => {
    useSearchParamsMock.mockReturnValue(buildSearchParams({ callbackUrl: '/dashboard' }));
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

    expect(sanitizeCallbackUrlMock).toHaveBeenCalledWith('/dashboard', window.location.origin);
    expect(routerReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('falls back to window location when sanitized callback is unsafe', async () => {
    const routerReplace = jest.fn();
    useRouterMock.mockReturnValue({ replace: routerReplace });

    useSearchParamsMock.mockReturnValue(buildSearchParams({ callbackUrl: 'https://evil.example' }));

    sanitizeCallbackUrlMock
      .mockReturnValueOnce(null) // initial memoized callback value
      .mockReturnValueOnce(null); // sanitize returned url from signIn

    signInMock.mockResolvedValue({
      error: null,
      url: 'https://evil.example',
    });

    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'valid@example.com');
    await user.type(screen.getByLabelText(/password/i), 'verysecure');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalled();
    });

    // first call is for query param, second for response url
    expect(sanitizeCallbackUrlMock.mock.calls[0]).toEqual([
      'https://evil.example',
      window.location.origin,
    ]);
    expect(sanitizeCallbackUrlMock.mock.calls[1]).toEqual([
      'https://evil.example',
      window.location.origin,
    ]);
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it('uses the callbackUrl fallback when signIn resolves without a url', async () => {
    useSearchParamsMock.mockReturnValue(buildSearchParams({ callbackUrl: '/dashboard' }));
    const routerReplace = jest.fn();
    useRouterMock.mockReturnValue({ replace: routerReplace });

    sanitizeCallbackUrlMock.mockReturnValue('/dashboard');
    signInMock.mockResolvedValue({ error: null, url: undefined });

    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith('/dashboard');
    });
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

  it('shows generic error when signIn returns unknown error', async () => {
    signInMock.mockResolvedValue({ error: 'SomeOtherError' });

    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/unable to sign in/i)).toBeInTheDocument();
  });

  it('handles signIn rejections gracefully', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    signInMock.mockRejectedValue(new Error('network down'));

    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
