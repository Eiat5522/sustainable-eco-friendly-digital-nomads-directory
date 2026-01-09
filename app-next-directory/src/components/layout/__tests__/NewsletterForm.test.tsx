/**
 * Unit tests for NewsletterForm.tsx
 * Tests the client-side newsletter form component
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { NewsletterForm } from '../NewsletterForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    warn: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, type, ...props }: any) => (
    <button type={type} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/neo-input', () => ({
  NeoInput: React.forwardRef((props: any, ref: any) => <input ref={ref} {...props} />),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('NewsletterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('should render the newsletter form', () => {
    render(<NewsletterForm />);

    expect(screen.getByText(/stay updated on sustainable travel/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('should have proper form accessibility attributes', () => {
    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autoComplete', 'email');
    expect(input).toHaveAttribute('inputMode', 'email');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('aria-describedby', 'newsletter-help');
    expect(input).toHaveAttribute('aria-errormessage', 'newsletter-error');
  });

  it('should update email input value', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    await user.type(input, 'test@example.com');

    expect(input).toHaveValue('test@example.com');
  });

  it('should validate email and prevent invalid submissions', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    // Try to submit with invalid email
    await user.type(input, 'invalid-email');
    await user.click(submitButton);

    // Router should not be called for invalid email
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should accept valid email addresses', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(input, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'newsletter-email',
        'test@example.com'
      );
      expect(mockPush).toHaveBeenCalledWith('/contact-us?type=newsletter');
    });
  });

  it('should trim whitespace from email before validation', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(input, '  test@example.com  ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'newsletter-email',
        'test@example.com'
      );
    });
  });

  it('should validate various email formats correctly', async () => {
    const user = userEvent.setup();

    const validEmails = [
      'test@example.com',
      'user+tag@example.co.uk',
      'test.name@example.org',
      '123@example.com',
    ];

    for (const email of validEmails) {
      const { unmount } = render(<NewsletterForm />);
      const input = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByRole('button', { name: /subscribe/i });

      await user.clear(input);
      await user.type(input, email);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/contact-us?type=newsletter');
      });

      unmount();
      jest.clearAllMocks();
    }
  });

  it('should reject various invalid email formats', async () => {
    const user = userEvent.setup();

    const invalidEmails = ['notanemail', '@example.com', 'test@'];

    for (const email of invalidEmails) {
      const { unmount } = render(<NewsletterForm />);
      const input = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByRole('button', { name: /subscribe/i });

      await user.type(input, email);
      await user.click(submitButton);

      // Invalid emails should not trigger navigation
      expect(mockPush).not.toHaveBeenCalled();

      unmount();
      jest.clearAllMocks();
    }
  });

  it('should accept corrected email after initial invalid attempt', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    // Submit invalid email
    await user.type(input, 'invalid');
    await user.click(submitButton);

    // Should not navigate
    expect(mockPush).not.toHaveBeenCalled();

    // Correct the email
    await user.clear(input);
    await user.type(input, 'valid@example.com');
    await user.click(submitButton);

    // Now it should navigate
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/contact-us?type=newsletter');
    });
  });

  it('should handle sessionStorage errors gracefully', async () => {
    const user = userEvent.setup();
    const mockSessionStorage = window.sessionStorage as jest.Mocked<Storage>;
    mockSessionStorage.setItem.mockImplementationOnce(() => {
      throw new Error('Storage quota exceeded');
    });

    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { name: /subscribe/i });

    await user.type(input, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/unable to proceed\. please try again or enable storage/i)
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should have aria-invalid attribute initially set to false', () => {
    render(<NewsletterForm />);

    const input = screen.getByPlaceholderText('Enter your email');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('should render newsletter description', () => {
    render(<NewsletterForm />);

    expect(
      screen.getByText(/get weekly updates on new sustainable venues/i)
    ).toBeInTheDocument();
  });

  it('should have screen reader help text', () => {
    render(<NewsletterForm />);

    const helpText = screen.getByText('We send occasional updates. Unsubscribe anytime.');
    expect(helpText).toHaveClass('sr-only');
  });
});
