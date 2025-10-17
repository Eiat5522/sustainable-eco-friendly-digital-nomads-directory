/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const signInMock = jest.fn();

jest.mock('next-auth/react', () => ({
  __esModule: true,
  signIn: signInMock,
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="mock-footer">Footer</div>,
}));

jest.mock('@/components/auth/SocialAuthRow', () => ({
  __esModule: true,
  default: () => <div data-testid="social-auth-row">social-auth</div>,
}));

jest.mock('@/components/ui/neo-input', () => ({
  NeoInput: ({ asChild, children, ...props }: any) => <input data-testid={props.id ?? props.name} {...props}>{children}</input>,
}));

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, asChild = false, ...props }: any) =>
    asChild ? <>{children}</> : (
      <button data-testid="neo-button" {...props}>
        {children}
      </button>
    ),
}));

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: ({ children }: any) => <div data-testid="neo-card">{children}</div>,
  NeoCardContent: ({ children }: any) => <div data-testid="neo-card-content">{children}</div>,
  NeoCardHeader: ({ children }: any) => <div data-testid="neo-card-header">{children}</div>,
  NeoCardTitle: ({ children }: any) => <h1 data-testid="neo-card-title">{children}</h1>,
}));

describe('SignupPage', () => {
  const originalEnv = process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH;
  const getPage = async () => (await import('../page')).default;

  beforeEach(() => {
    signInMock.mockReset();
    (global as any).fetch = jest.fn();
    process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH = 'false';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH = originalEnv;
  });

  it('submits credentials and signs the user in on success', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    render(<Page />);

    await user.type(screen.getByPlaceholderText('Name'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('Email'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secretpass');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jane Doe', email: 'jane@example.com', password: 'secretpass' }),
    }));

    expect(signInMock).toHaveBeenCalledWith('credentials', expect.objectContaining({
      email: 'jane@example.com',
      password: 'secretpass',
      callbackUrl: '/',
    }));
  });

  it('surfaces API error messages returned from the register endpoint', async () => {
    process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH = 'true';
    const Page = await getPage();
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: { message: 'Email already registered' } }),
    });

    render(<Page />);

    await user.type(screen.getByPlaceholderText('Name'), 'Sam Example');
    await user.type(screen.getByPlaceholderText('Email'), 'sam@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await screen.findByRole('alert');

    expect(screen.getByRole('alert')).toHaveTextContent('Email already registered');
    expect(signInMock).not.toHaveBeenCalled();
    expect(screen.getAllByText('Social sign-in is temporarily disabled.')).toHaveLength(2);
  });

  it('shows a generic error when the API response body cannot be parsed', async () => {
    const Page = await getPage();
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockRejectedValue(new Error('invalid json')),
    });

    render(<Page />);

    await user.type(screen.getByPlaceholderText('Name'), 'Jamie');
    await user.type(screen.getByPlaceholderText('Email'), 'jamie@example.com');
    await user.type(screen.getByPlaceholderText('Password'), '12345678');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to sign up');
  });
});
