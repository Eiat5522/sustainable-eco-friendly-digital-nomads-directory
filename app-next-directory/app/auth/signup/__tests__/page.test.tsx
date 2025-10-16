import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
const mockSignIn = jest.fn();

jest.mock('next-auth/react', () => ({
  __esModule: true,
  signIn: mockSignIn,
}));

jest.mock('@/components/auth/SocialAuthRow', () => ({
  __esModule: true,
  default: () => <div data-testid="social-auth">Social Auth Row</div>,
}));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  Header: () => <header data-testid="header">Header</header>,
}));

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock('@/components/ui/neo-input', () => ({
  __esModule: true,
  NeoInput: React.forwardRef((props: any, ref) => (
    <input {...props} ref={ref} data-testid={props.id || props.name} />
  )),
}));

jest.mock('@/components/ui/neo-button', () => ({
  __esModule: true,
  NeoButton: ({ children, ...props }: any) => (
    <button {...props} data-testid="submit-button">
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/neo-card', () => ({
  __esModule: true,
  NeoCard: ({ children, className }: any) => (
    <div className={className} data-testid="neo-card">{children}</div>
  ),
  NeoCardContent: ({ children }: any) => (
    <div data-testid="neo-card-content">{children}</div>
  ),
  NeoCardHeader: ({ children }: any) => (
    <div data-testid="neo-card-header">{children}</div>
  ),
  NeoCardTitle: ({ children }: any) => (
    <h2 data-testid="neo-card-title">{children}</h2>
  ),
}));

import SignupPage from '../page';

describe('SignupPage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
    mockSignIn.mockResolvedValue({ ok: true });
    delete process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Rendering', () => {
    it('renders the signup page with all elements', () => {
      render(<SignupPage />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('neo-card')).toBeInTheDocument();
      expect(screen.getByTestId('name')).toBeInTheDocument();
      expect(screen.getByTestId('email')).toBeInTheDocument();
      expect(screen.getByTestId('password')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('displays the Sign Up title', () => {
      render(<SignupPage />);

      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('displays create your account heading', () => {
      render(<SignupPage />);

      expect(screen.getByText('Create your account')).toBeInTheDocument();
    });

    it('displays descriptive text', () => {
      render(<SignupPage />);

      expect(
        screen.getByText(/Create an account to start reviewing and saving listings/i)
      ).toBeInTheDocument();
    });

    it('renders social auth rows when OAuth is enabled', () => {
      render(<SignupPage />);

      const socialAuthElements = screen.getAllByTestId('social-auth');
      expect(socialAuthElements.length).toBeGreaterThan(0);
    });

    it('renders input fields with correct attributes', () => {
      render(<SignupPage />);

      const nameInput = screen.getByTestId('name');
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('autoComplete', 'name');
      expect(nameInput).toHaveAttribute('required');

      const emailInput = screen.getByTestId('email');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(emailInput).toHaveAttribute('required');

      const passwordInput = screen.getByTestId('password');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
      expect(passwordInput).toHaveAttribute('minLength', '8');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('Form submission', () => {
    it('submits form with valid data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<SignupPage />);

      const nameInput = screen.getByTestId('name');
      const emailInput = screen.getByTestId('email');
      const passwordInput = screen.getByTestId('password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/register',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'John Doe',
              email: 'john@example.com',
              password: 'password123',
            }),
          })
        );
      });
    });

    it('calls signIn after successful registration', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<SignupPage />);

      const nameInput = screen.getByTestId('name');
      const emailInput = screen.getByTestId('email');
      const passwordInput = screen.getByTestId('password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'securepass123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'jane@example.com',
          password: 'securepass123',
          callbackUrl: '/',
        });
      });
    });

    it('updates state when input values change', () => {
      render(<SignupPage />);

      const nameInput = screen.getByTestId('name') as HTMLInputElement;
      const emailInput = screen.getByTestId('email') as HTMLInputElement;
      const passwordInput = screen.getByTestId('password') as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });

      expect(nameInput.value).toBe('Test User');
      expect(emailInput.value).toBe('test@test.com');
      expect(passwordInput.value).toBe('testpass');
    });
  });

  describe('Error handling', () => {
    it('displays error message when registration fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { message: 'User already exists' },
        }),
      });

      render(<SignupPage />);

      const nameInput = screen.getByTestId('name');
      const emailInput = screen.getByTestId('email');
      const passwordInput = screen.getByTestId('password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('User already exists')).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('displays generic error when response has no error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<SignupPage />);

      const nameInput = screen.getByTestId('name');
      const emailInput = screen.getByTestId('email');
      const passwordInput = screen.getByTestId('password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to sign up')).toBeInTheDocument();
      });
    });

    it('displays generic error when JSON parsing fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<SignupPage />);

      const nameInput = screen.getByTestId('name');
      const emailInput = screen.getByTestId('email');
      const passwordInput = screen.getByTestId('password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to sign up')).toBeInTheDocument();
      });
    });

    it('clears error message on new submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Error occurred' } }),
      });

      render(<SignupPage />);

      const nameInput = screen.getByTestId('name');
      const emailInput = screen.getByTestId('email');
      const passwordInput = screen.getByTestId('password');
      const submitButton = screen.getByTestId('submit-button');

      // First submission with error
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });

      // Second submission should clear error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
      });
    });
  });

  describe('OAuth disabled state', () => {
    it('displays disabled message when OAuth is disabled', () => {
      process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH = 'true';

      render(<SignupPage />);

      expect(
        screen.getByText('Social sign-in is temporarily disabled.')
      ).toBeInTheDocument();
    });

    it('does not render SocialAuthRow when OAuth is disabled', () => {
      process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH = 'true';

      render(<SignupPage />);

      const socialAuthElements = screen.queryAllByTestId('social-auth');
      expect(socialAuthElements.length).toBe(0);
    });

    it('renders SocialAuthRow when OAuth is enabled', () => {
      delete process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH;

      render(<SignupPage />);

      const socialAuthElements = screen.getAllByTestId('social-auth');
      expect(socialAuthElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper role attribute on error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Error message' } }),
      });

      render(<SignupPage />);

      const nameInput = screen.getByTestId('name');
      const emailInput = screen.getByTestId('email');
      const passwordInput = screen.getByTestId('password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByText('Error message');
        expect(errorElement).toHaveAttribute('role', 'alert');
        expect(errorElement).toHaveAttribute('aria-live', 'assertive');
        expect(errorElement).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('has proper autocomplete attributes', () => {
      render(<SignupPage />);

      expect(screen.getByTestId('name')).toHaveAttribute('autoComplete', 'name');
      expect(screen.getByTestId('email')).toHaveAttribute('autoComplete', 'email');
      expect(screen.getByTestId('password')).toHaveAttribute(
        'autoComplete',
        'new-password'
      );
    });

    it('has proper name attributes for form fields', () => {
      render(<SignupPage />);

      expect(screen.getByTestId('name')).toHaveAttribute('name', 'name');
      expect(screen.getByTestId('email')).toHaveAttribute('name', 'email');
      expect(screen.getByTestId('password')).toHaveAttribute('name', 'password');
    });

    it('has autofocus on name input', () => {
      render(<SignupPage />);

      const nameInput = screen.getByTestId('name');
      expect(nameInput).toHaveAttribute('autoFocus');
    });
  });

  describe('Content', () => {
    it('displays eco-forward community message', () => {
      render(<SignupPage />);

      expect(
        screen.getByText(
          /Join our eco-forward community and explore sustainable places/i
        )
      ).toBeInTheDocument();
    });

    it('displays submit button with correct text', () => {
      render(<SignupPage />);

      expect(screen.getByTestId('submit-button')).toHaveTextContent('Sign Up');
    });

    it('renders card components', () => {
      render(<SignupPage />);

      expect(screen.getByTestId('neo-card')).toBeInTheDocument();
      expect(screen.getByTestId('neo-card-header')).toBeInTheDocument();
      expect(screen.getByTestId('neo-card-content')).toBeInTheDocument();
      expect(screen.getByTestId('neo-card-title')).toBeInTheDocument();
    });

    it('displays divider with text', () => {
      render(<SignupPage />);

      expect(screen.getByText('or continue with')).toBeInTheDocument();
    });
  });
});
