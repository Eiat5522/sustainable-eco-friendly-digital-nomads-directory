import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Admin Error Component', () => {
  const mockReset = jest.fn();
  const mockError = new Error('Test error message');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render error message', () => {
    const ErrorComponent = require('../error').default;
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should call reset when Try again button is clicked', async () => {
    const ErrorComponent = require('../error').default;
    const user = userEvent.setup();
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByText('Try again');
    await user.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('should log error to console on mount', () => {
    const ErrorComponent = require('../error').default;
    const consoleErrorSpy = jest.spyOn(console, 'error');
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Dashboard error:', mockError);
  });

  it('should apply correct CSS classes', () => {
    const ErrorComponent = require('../error').default;
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const container = screen.getByText('Something went wrong!').parentElement;
    expect(container).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'min-h-screen'
    );

    const heading = screen.getByText('Something went wrong!');
    expect(heading).toHaveClass('text-2xl', 'font-bold', 'mb-4');

    const button = screen.getByText('Try again');
    expect(button).toHaveClass(
      'px-4',
      'py-2',
      'bg-blue-500',
      'text-white',
      'rounded',
      'hover:bg-blue-600'
    );
  });

  it('should handle error with digest property', () => {
    const ErrorComponent = require('../error').default;

    const errorWithDigest = Object.assign(new Error('Error with digest'), {
      digest: 'abc123',
    });

    render(<ErrorComponent error={errorWithDigest} reset={mockReset} />);

    expect(console.error).toHaveBeenCalledWith('Dashboard error:', errorWithDigest);
  });

  it('should re-log error when error prop changes', () => {
    const ErrorComponent = require('../error').default;

    const { rerender } = render(<ErrorComponent error={mockError} reset={mockReset} />);

    expect(console.error).toHaveBeenCalledTimes(1);

    const newError = new Error('New error');
    rerender(<ErrorComponent error={newError} reset={mockReset} />);

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith('Dashboard error:', newError);
  });

  it('should render button as clickable element', () => {
    const ErrorComponent = require('../error').default;
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const button = screen.getByText('Try again');
    expect(button.tagName).toBe('BUTTON');
  });

  it('should center content vertically and horizontally', () => {
    const ErrorComponent = require('../error').default;
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const container = screen.getByText('Something went wrong!').closest('div');
    expect(container).toHaveClass('items-center', 'justify-center');
  });

  it('should render h2 heading element', () => {
    const ErrorComponent = require('../error').default;
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const heading = screen.getByText('Something went wrong!');
    expect(heading.tagName).toBe('H2');
  });

  it('should cleanup effect on unmount', () => {
    const ErrorComponent = require('../error').default;
    const consoleErrorSpy = jest.spyOn(console, 'error');

    const { unmount } = render(<ErrorComponent error={mockError} reset={mockReset} />);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    unmount();

    // Should not log again after unmount
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple button clicks', async () => {
    const ErrorComponent = require('../error').default;
    const user = userEvent.setup();
    render(<ErrorComponent error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByText('Try again');
    await user.click(tryAgainButton);
    await user.click(tryAgainButton);
    await user.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalledTimes(3);
  });
});
