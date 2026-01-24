/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LoginLoading from '../loading';

describe('LoginLoading', () => {
  it('should render loading spinner with correct role', () => {
    render(<LoginLoading />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render loading text for screen readers', () => {
    render(<LoginLoading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render login page loading message', () => {
    render(<LoginLoading />);

    expect(screen.getByText('Loading login page...')).toBeInTheDocument();
  });

  it('should apply correct container classes', () => {
    const { container } = render(<LoginLoading />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('relative', 'min-h-screen', 'flex', 'items-center', 'justify-center', 'px-4');
  });

  it('should apply animation classes to spinner', () => {
    render(<LoginLoading />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-4');
  });

  it('should have accessible spinner text hidden visually but available to screen readers', () => {
    render(<LoginLoading />);

    const hiddenText = screen.getByText('Loading...');
    expect(hiddenText).toHaveClass('!absolute', '!-m-px', '!h-px', '!w-px', '!overflow-hidden');
  });

  it('should center content in viewport', () => {
    const { container } = render(<LoginLoading />);

    const textCenter = container.querySelector('.text-center');
    expect(textCenter).toBeInTheDocument();
  });

  it('should style loading message with correct text color', () => {
    render(<LoginLoading />);

    const loadingMessage = screen.getByText('Loading login page...');
    expect(loadingMessage).toHaveClass('text-gray-600');
  });

  it('should apply margin to loading message', () => {
    render(<LoginLoading />);

    const loadingMessage = screen.getByText('Loading login page...');
    expect(loadingMessage).toHaveClass('mt-4');
  });

  it('should render as paragraph element', () => {
    render(<LoginLoading />);

    const loadingMessage = screen.getByText('Loading login page...');
    expect(loadingMessage.tagName).toBe('P');
  });
});
