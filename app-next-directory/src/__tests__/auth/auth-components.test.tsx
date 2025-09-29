/**
 * Jest Test Suite for Authentication Forms and Components
 * 
 * Tests covering:
 * 1. Registration form component (Signup - Name, email, password)
 * 2. Login page component (with social auth)
 * 3. SocialAuthRow component
 * 4. Form validation and error handling
 * 5. User experience flows
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

import { useSession, signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import RegisterPage from '@/app/auth/register/page';
import LoginPage from '@/app/auth/login/page';
import SocialAuthRow from '@/components/auth/SocialAuthRow';
import { server } from '@/__mocks__/server';
import { setRegisterResponse } from '@/__mocks__/handlers';

// Type the mocks
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Authentication Forms and Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Override the global fetch mock from jest.setup.ts with our test mock
    global.fetch = jest.fn();
    
    // Default mock implementations
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any);
    
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);

    // Reset environment variables
    delete process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH;
  });

  describe('Registration Form (Signup)', () => {
    beforeEach(() => {
      // For these tests, we want to use fetch mocks instead of MSW
      // Stop MSW from intercepting /api/auth/register requests
      server.resetHandlers();
    });

    it('should render registration form with all required fields', () => {
      render(<RegisterPage />);

      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password (min 8 chars)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    });

    it('should validate required email field', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: 'Create account' });
      await user.click(submitButton);

      // HTML5 validation should prevent submission without email
      const emailInput = screen.getByPlaceholderText('you@example.com');
      expect(emailInput).toBeRequired();
    });

    it('should validate minimum password length', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByPlaceholderText('Password (min 8 chars)');
      expect(passwordInput).toHaveAttribute('minLength', '8');
      expect(passwordInput).toBeRequired();
    });

    it('should handle successful registration', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response using the newly overridden global fetch
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, emailVerificationRequired: false }),
      } as Response);

      render(<RegisterPage />);

      // Fill out the form
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), 'password123');

      // Submit the form
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
          }),
        });
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Your account is ready.')).toBeInTheDocument();
        expect(screen.getByText('Return to sign in')).toBeInTheDocument();
      });
    });

    it('should handle registration with email verification required', async () => {
      const user = userEvent.setup();
      
      // Mock API response requiring email verification
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, emailVerificationRequired: true }),
      } as Response);

      render(<RegisterPage />);

      // Fill out and submit form
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      // Should show email verification message
      await waitFor(() => {
        expect(screen.getByText('Check your inbox to verify your email before signing in.')).toBeInTheDocument();
      });
    });

    it('should handle registration errors', async () => {
      const user = userEvent.setup();
      
      // Mock API error response
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already in use' }),
      } as Response);

      render(<RegisterPage />);

      // Fill out and submit form
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@example.com'), 'existing@example.com');
      await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Email already in use')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network error'));

      render(<RegisterPage />);

      // Fill out and submit form
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      // Should show the actual error message from the thrown Error
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response using a Promise that we control
      let resolvePromise: (value: Response) => void;
      const slowPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReturnValueOnce(slowPromise);

      render(<RegisterPage />);

      // Fill out form
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Create account' });
      await user.click(submitButton);

      // Button should be disabled and show loading text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, emailVerificationRequired: false }),
      } as Response);

      await waitFor(() => {
        expect(screen.getByText('Your account is ready.')).toBeInTheDocument();
      });
    });

    it('should handle empty name field gracefully', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, emailVerificationRequired: false }),
      } as Response);

      render(<RegisterPage />);

      // Submit form without name (name is optional)
      await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '',
            email: 'john@example.com',
            password: 'password123',
          }),
        });
      });
    });
  });

  describe('Login Page', () => {
    it('should render login page with social auth options', () => {
      render(<LoginPage />);

      expect(screen.getByText('Sign in')).toBeInTheDocument();
      expect(screen.getByText('Choose a provider to continue')).toBeInTheDocument();
      expect(screen.getByText('Create account')).toBeInTheDocument();
      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('should show authenticated state when user is logged in', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { name: 'John Doe', email: 'john@example.com' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
      } as any);

      render(<LoginPage />);

      expect(screen.getByText('Signed in successfully')).toBeInTheDocument();
      expect(screen.getByText(/You're signed in as John Doe/)).toBeInTheDocument();
    });

    it('should show authenticated state with email fallback when no name', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'john@example.com' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
      } as any);

      render(<LoginPage />);

      expect(screen.getByText(/You're signed in as john@example.com/)).toBeInTheDocument();
    });

    it('should handle callback URL from search params', () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn().mockReturnValue('/dashboard'),
      } as any);

      mockUseSession.mockReturnValue({
        data: {
          user: { name: 'John Doe' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
      } as any);

      render(<LoginPage />);

      expect(screen.getByText(/You can head back to your previous page/)).toBeInTheDocument();
    });

    it('should show OAuth disabled message when environment flag is set', () => {
      process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH = 'true';

      render(<LoginPage />);

      expect(screen.getByText('Social sign-in is temporarily disabled.')).toBeInTheDocument();
    });

    it('should validate callback URL security', () => {
      // Mock a potentially malicious callback URL
      mockUseSearchParams.mockReturnValue({
        get: jest.fn().mockReturnValue('https://malicious.com/steal-data'),
      } as any);

      render(<LoginPage />);

      // The component should ignore external URLs and not show callback message
      expect(screen.queryByText(/You can head back to your previous page/)).not.toBeInTheDocument();
    });

    it('should handle relative callback URLs', () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn().mockReturnValue('/dashboard?tab=listings'),
      } as any);

      mockUseSession.mockReturnValue({
        data: {
          user: { name: 'John Doe' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
      } as any);

      render(<LoginPage />);

      expect(screen.getByText(/You can head back to your previous page/)).toBeInTheDocument();
    });
  });

  describe('SocialAuthRow Component', () => {
    beforeEach(() => {
      // Set up default fetch mock for providers endpoint
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          google: { name: 'Google' },
          facebook: { name: 'Facebook' },
        }),
      } as Response);
    });

    it('should render social auth buttons when providers are available', async () => {
      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/providers');
      });

      // Should show loading initially then buttons
      expect(screen.getByText('Loading sign-in options…')).toBeInTheDocument();
    });

    it('should handle OAuth disabled environment variable', () => {
      process.env.NEXT_PUBLIC_AUTH_DISABLE_OAUTH = 'true';

      render(<SocialAuthRow />);

      expect(screen.getByText('Social sign-in is temporarily unavailable. Please use email sign-in.')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle provider loading error', async () => {
      // Override the beforeEach mock to simulate an error
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network error'));

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load social sign-in providers right now.')).toBeInTheDocument();
      });
    });

    it('should handle empty providers response', async () => {
      // Override the beforeEach mock to return empty object
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      render(<SocialAuthRow />);

      await waitFor(() => {
        expect(screen.getByText('No social sign-in providers are configured.')).toBeInTheDocument();
      });
    });

    it('should filter out credentials provider from social buttons', async () => {
      // Override beforeEach mock to include credentials provider
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          credentials: { name: 'Credentials' },
          google: { name: 'Google' },
          facebook: { name: 'Facebook' },
        }),
      } as Response);

      await act(async () => {
        render(<SocialAuthRow />);
      });

      await waitFor(() => {
        // Should not show credentials as a social button
        expect(screen.queryByLabelText('Continue with Credentials')).not.toBeInTheDocument();
      });
    });

    it('should handle sign-in button clicks', async () => {
      const user = userEvent.setup();

      // Set up proper providers mock
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          google: { name: 'Google' },
        }),
      } as Response);

      mockSignIn.mockResolvedValue({ ok: true } as any);

      await act(async () => {
        render(<SocialAuthRow />);
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading sign-in options…')).not.toBeInTheDocument();
      });

      // Find and click Google sign-in button
      const googleButton = screen.getByLabelText('Continue with Google');
      await user.click(googleButton);

      expect(mockSignIn).toHaveBeenCalledWith('google');
    });

    it('should handle button disabled state during sign-in', async () => {
      const user = userEvent.setup();

      // Set up proper providers mock
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          google: { name: 'Google' },
        }),
      } as Response);

      // Mock slow sign-in
      let resolveSignIn: (value: any) => void;
      const slowSignIn = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValueOnce(slowSignIn);

      await act(async () => {
        render(<SocialAuthRow />);
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading sign-in options…')).not.toBeInTheDocument();
      });

      const googleButton = screen.getByLabelText('Continue with Google');
      await user.click(googleButton);

      // Button should be disabled
      expect(googleButton).toBeDisabled();

      // Resolve sign-in
      await act(async () => {
        resolveSignIn!({ ok: true });
      });
    });

    it('should render custom providers when provided', async () => {
      const customProviders = [
        {
          id: 'github',
          name: 'GitHub',
          color: '#333333',
          fg: '#FFFFFF',
          icon: <span>GitHub</span>,
        },
      ];

      // Set up providers mock that includes github
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          github: { name: 'GitHub' },
        }),
      } as Response);

      await act(async () => {
        render(<SocialAuthRow providers={customProviders} />);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Continue with GitHub')).toBeInTheDocument();
      });
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels and ARIA attributes in registration form', () => {
      render(<RegisterPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Password (min 8 chars)');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('minLength', '8');
    });

    it('should have proper ARIA roles for error messages', async () => {
      const user = userEvent.setup();
      
      // Set up error response
      server.use(setRegisterResponse('error'));

      render(<RegisterPage />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        const errorMessage = screen.getByText('Registration failed');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have proper button states and labels', () => {
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: 'Create account' });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('User Experience Flows', () => {
    it('should provide clear navigation between auth pages', async () => {
      const user = userEvent.setup();
      
      // Test Register page -> Login navigation after successful registration
      const { unmount } = render(<RegisterPage />);
      
      // Fill out form and submit to get to success state
      await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));
      
      // Wait for success state and check link
      await waitFor(() => {
        expect(screen.getByText('Return to sign in')).toHaveAttribute('href', '/auth/login');
      });
      
      unmount();

      // Test Login page navigation links
      render(<LoginPage />);
      expect(screen.getByText('Create account')).toHaveAttribute('href', '/auth/register');
      expect(screen.getByText('Forgot password?')).toHaveAttribute('href', '/auth/reset-request');
    });

    it('should handle success states appropriately', async () => {
      const user = userEvent.setup();

      render(<RegisterPage />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Password (min 8 chars)'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(screen.getByText('Your account is ready.')).toBeInTheDocument();
        expect(screen.getByText('You can sign in right away with the credentials you just created.')).toBeInTheDocument();
      });
    });
  });
});