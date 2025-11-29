import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';

// Mock NeoButton
jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    variant: string;
  }) => (
    <button type="button" onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

import ErrorComponent from '../error';

describe('Error Component', () => {
  let mockError: Error;
  let mockReset: jest.Mock;

  beforeEach(() => {
    mockError = new Error('Test error message');
    mockReset = jest.fn();
  });

  it('renders error message and buttons', () => {
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    expect(screen.getByRole('heading', { name: /unexpected error/i })).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('calls reset function when retry button is clicked', () => {
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const errorWithDigest = Object.assign(new Error('Test error'), { digest: 'abc123' });

    render(<ErrorComponent error={errorWithDigest} reset={mockReset} />);

    expect(screen.queryByText(/error code/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<ErrorComponent error={mockError} reset={mockReset} />);

    // The error message is shown in a pre element in development
    expect(screen.getByText('Test error message')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('has proper ARIA attributes', () => {
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const section = screen.getByRole('region', { name: /unexpected error/i });
    expect(section).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
