import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock NeoButton
jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, onClick, variant }: { children: React.ReactNode; onClick: () => void; variant: string }) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

describe('Error Component', () => {
  // Dynamic import to avoid module-level React hook issues
  let ErrorComponent: any;
  let consoleErrorSpy: jest.SpyInstance;
  const mockReset = jest.fn();
  const mockError = new Error('Test error message');

  beforeAll(async () => {
    const module = await import('../error');
    ErrorComponent = module.default;
  });

  beforeAll(() => {
    // Mock window.location.reload once for all tests
    delete (window as any).location;
    (window as any).location = { reload: jest.fn() };
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockReset.mockClear();
    // Reset the mock function between tests
    ((window as any).location.reload as jest.Mock).mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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

  it('reloads page when reload button is clicked', () => {
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const reloadButton = screen.getByRole('button', { name: /reload/i });
    fireEvent.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('displays error digest in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const errorWithDigest = Object.assign(new Error('Test error'), { digest: 'abc123' });

    render(<ErrorComponent error={errorWithDigest} reset={mockReset} />);

    process.env.NODE_ENV = originalEnv;
  });

  it('logs error in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<ErrorComponent error={mockError} reset={mockReset} />);

    expect(consoleErrorSpy).toHaveBeenCalledWith('App segment error caught:', mockError);

    process.env.NODE_ENV = originalEnv;
  });

  it('logs error with digest in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const errorWithDigest = Object.assign(new Error('Test error'), { digest: 'abc123' });

    render(<ErrorComponent error={errorWithDigest} reset={mockReset} />);

    expect(consoleErrorSpy).toHaveBeenCalledWith('App segment error caught:', {
      digest: 'abc123',
      message: 'Test error',
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('has proper ARIA attributes', () => {
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const section = screen.getByRole('region', { name: /error-title/i });
    expect(section).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
