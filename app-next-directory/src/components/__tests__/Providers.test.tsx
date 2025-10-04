import { render, screen } from '@testing-library/react';
import Providers from '../Providers';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/auth/clientAuth';

jest.mock('next-auth/react', () => ({
  SessionProvider: jest.fn(({ children }) => <div data-testid="session-provider">{children}</div>),
}));

jest.mock('@/lib/auth/clientAuth', () => ({
  AuthProvider: jest.fn(({ children }) => <div data-testid="auth-provider">{children}</div>),
}));

describe('Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children within provider hierarchy', () => {
    render(
      <Providers>
        <div data-testid="test-child">Test Content</div>
      </Providers>
    );

    expect(screen.getByTestId('test-child')).toHaveTextContent('Test Content');
  });

  it('wraps children in SessionProvider', () => {
    render(
      <Providers>
        <div>Test</div>
      </Providers>
    );

    expect(SessionProvider).toHaveBeenCalled();
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
  });

  it('wraps children in AuthProvider', () => {
    render(
      <Providers>
        <div>Test</div>
      </Providers>
    );

    expect(AuthProvider).toHaveBeenCalled();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('maintains proper provider nesting order', () => {
    const { container } = render(
      <Providers>
        <div data-testid="inner-content">Content</div>
      </Providers>
    );

    const sessionProvider = screen.getByTestId('session-provider');
    const authProvider = screen.getByTestId('auth-provider');
    const content = screen.getByTestId('inner-content');

    // SessionProvider should contain AuthProvider
    expect(sessionProvider).toContainElement(authProvider);
    // AuthProvider should contain the actual content
    expect(authProvider).toContainElement(content);
  });

  it('renders multiple children correctly', () => {
    render(
      <Providers>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </Providers>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('handles empty children', () => {
    const { container } = render(<Providers>{null}</Providers>);

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('handles undefined children', () => {
    const { container } = render(<Providers>{undefined}</Providers>);

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('passes ReactNode children types correctly', () => {
    render(
      <Providers>
        <span>Text</span>
        {42}
        {true && <div>Conditional</div>}
      </Providers>
    );

    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Conditional')).toBeInTheDocument();
  });
});
