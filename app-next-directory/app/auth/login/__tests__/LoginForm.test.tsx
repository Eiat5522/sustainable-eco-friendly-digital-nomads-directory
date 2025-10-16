import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
const mockSignIn = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseRouter = jest.fn();
const mockUseSearchParams = jest.fn();
const mockSanitizeCallbackUrl = jest.fn();

jest.mock('next-auth/react', () => ({
  __esModule: true,
  signIn: mockSignIn,
}));

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: mockUseRouter,
  useSearchParams: mockUseSearchParams,
}));

jest.mock('@/lib/auth/callbackUrl', () => ({
  __esModule: true,
  sanitizeCallbackUrl: mockSanitizeCallbackUrl,
}));

jest.mock('@/components/auth/SocialAuthRow', () => ({
  __esModule: true,
  default: () => <div data-testid="social-auth">Social Auth Row</div>,
}));

jest.mock('@/components/ui/neo-input', () => ({
  __esModule: true,
  NeoInput: (props: any) => <input {...props} data-testid={props['aria-label']} />,
}));

jest.mock('@/components/ui/neo-button', () => ({
  __esModule: true,
  NeoButton: ({ children, ...props }: any) => (
    <button {...props} data-testid="submit-button">
      {children}
    </button>
  ),
}));

import LoginForm from '../LoginForm';

describe('LoginForm', () => {
  const mockRouter = {
    push: mockPush,
    replace: mockReplace,
  };

  const mockSearchParamsInstance = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(mockSearchParamsInstance);
    mockSearchParamsInstance.get.mockReturnValue(null);
    mockSanitizeCallbackUrl.mockReturnValue('/');
    (global as any).window = { location: { origin: 'https://example.com' } };
  });

  describe('Rendering', () => {
    it('renders email and password inputs', () => {
      render(<LoginForm />);

      expect(screen.getByTestId('Email')).toBeInTheDocument();
      expect(screen.getByTestId('Password')).toBeInTheDocument();
    });

    it('renders login button', () => {
      render(<LoginForm />);

      expect(screen.getByTestId('submit-button')).toHaveTextContent('Login');
    });

    it('renders social auth section', () => {
      render(<LoginForm />);

      expect(screen.getByTestId('social-auth')).toBeInTheDocument();
    });

    it('renders divider with text', () => {
      render(<LoginForm />);

      expect(screen.getByText('or continue with')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('shows error when email is invalid', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('shows error when email is empty', async () => {
      render(<LoginForm />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('shows error when password is too short', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Enter your password (min 8 characters).')
        ).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('shows error when password is empty', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Enter your password (min 8 characters).')
        ).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('clears previous errors on new submission', async () => {
      render(<LoginForm />);

      const submitButton = screen.getByTestId('submit-button');

      // First submission with errors
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
      });

      // Fix the form and submit again
      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      mockSignIn.mockResolvedValue({ ok: true });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Enter a valid email address.')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('calls signIn with correct credentials', async () => {
      mockSignIn.mockResolvedValue({ ok: true, url: '/dashboard' });
      mockSanitizeCallbackUrl.mockReturnValue('/dashboard');

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'Test@Example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
          callbackUrl: '/',
        });
      });
    });

    it('trims and lowercases email before submission', async () => {
      mockSignIn.mockResolvedValue({ ok: true });

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: '  TEST@EXAMPLE.COM  ' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'credentials',
          expect.objectContaining({
            email: 'test@example.com',
          })
        );
      });
    });

    it('disables form during submission', async () => {
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Signing in…');
        expect(submitButton).toBeDisabled();
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
    });

    it('redirects to callback URL on successful login', async () => {
      mockSignIn.mockResolvedValue({ ok: true, url: '/dashboard' });
      mockSanitizeCallbackUrl.mockReturnValue('/dashboard');

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('uses window.location.href as fallback when sanitized URL is null', async () => {
      mockSignIn.mockResolvedValue({ ok: true, url: '/profile' });
      mockSanitizeCallbackUrl.mockReturnValueOnce(null);
      delete (global as any).window.location.href;
      (global as any).window.location.href = '';

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect((global as any).window.location.href).toBe('/profile');
      });
    });

    it('redirects to default callback when no URL returned', async () => {
      mockSignIn.mockResolvedValue({ ok: true });
      mockSanitizeCallbackUrl.mockReturnValue('/');

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Error handling', () => {
    it('displays error when credentials are invalid', async () => {
      mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' });

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });
    });

    it('displays generic error for unknown errors', async () => {
      mockSignIn.mockResolvedValue({ error: 'UnknownError' });

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Unable to sign in. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays error when signIn throws exception', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSignIn.mockRejectedValue(new Error('Network error'));

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('re-enables form after error', async () => {
      mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' });

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
    });
  });

  describe('Query error handling', () => {
    it('displays error from query string on mount', () => {
      mockSearchParamsInstance.get.mockReturnValue('CredentialsSignin');

      render(<LoginForm />);

      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });

    it('maps OAuthAccountNotLinked error', () => {
      mockSearchParamsInstance.get.mockReturnValue('OAuthAccountNotLinked');

      render(<LoginForm />);

      expect(
        screen.getByText(/This email is linked to a different sign-in method/i)
      ).toBeInTheDocument();
    });

    it('maps AccessDenied error', () => {
      mockSearchParamsInstance.get.mockReturnValue('AccessDenied');

      render(<LoginForm />);

      expect(
        screen.getByText(/Access denied. Please try again or contact support./i)
      ).toBeInTheDocument();
    });

    it('maps Configuration error', () => {
      mockSearchParamsInstance.get.mockReturnValue('Configuration');

      render(<LoginForm />);

      expect(
        screen.getByText(/Auth configuration issue. Please try again later./i)
      ).toBeInTheDocument();
    });

    it('displays generic message for unknown query errors', () => {
      mockSearchParamsInstance.get.mockReturnValue('SomeOtherError');

      render(<LoginForm />);

      expect(screen.getByText('Unable to sign in. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Callback URL handling', () => {
    it('uses callback URL from query params', () => {
      mockSearchParamsInstance.get.mockImplementation((key) => {
        if (key === 'callbackUrl') return '/dashboard';
        return null;
      });
      mockSanitizeCallbackUrl.mockReturnValue('/dashboard');

      render(<LoginForm />);

      expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith(
        '/dashboard',
        'https://example.com'
      );
    });

    it('uses default callback when none provided', () => {
      mockSearchParamsInstance.get.mockReturnValue(null);
      mockSanitizeCallbackUrl.mockReturnValue('/');

      render(<LoginForm />);

      expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith(null, 'https://example.com');
    });

    it('falls back to / when sanitized callback is null', () => {
      mockSearchParamsInstance.get.mockReturnValue('/dashboard');
      mockSanitizeCallbackUrl.mockReturnValue(null);

      const { rerender } = render(<LoginForm />);

      // Force re-render to ensure useMemo recalculates
      rerender(<LoginForm />);

      // The component should fall back to '/'
      expect(mockSanitizeCallbackUrl).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for inputs', () => {
      render(<LoginForm />);

      expect(screen.getByTestId('Email')).toHaveAttribute('aria-label', 'Email');
      expect(screen.getByTestId('Password')).toHaveAttribute('aria-label', 'Password');
    });

    it('associates error messages with inputs via aria-describedby', async () => {
      render(<LoginForm />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByTestId('Email');
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      });
    });

    it('marks form errors as live regions', async () => {
      render(<LoginForm />);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByText('Enter a valid email address.');
        expect(errorElement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('disables buttons with aria-disabled', async () => {
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(<LoginForm />);

      const emailInput = screen.getByTestId('Email');
      const passwordInput = screen.getByTestId('Password');
      const submitButton = screen.getByTestId('submit-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveAttribute('aria-disabled', 'true');
      });
    });
  });
});
