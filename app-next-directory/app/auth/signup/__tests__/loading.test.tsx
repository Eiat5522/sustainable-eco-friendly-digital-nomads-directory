/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SignupLoading from '../loading';

describe('SignupLoading', () => {
  it('should render loading spinner with correct role', () => {
    render(<SignupLoading />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render loading text for screen readers', () => {
    render(<SignupLoading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render signup page loading message', () => {
    render(<SignupLoading />);

    expect(screen.getByText('Loading signup page...')).toBeInTheDocument();
  });

  it('should apply correct container classes', () => {
    const { container } = render(<SignupLoading />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('relative', 'min-h-screen', 'flex', 'items-center', 'justify-center', 'px-4');
  });

  it('should apply animation classes to spinner', () => {
    render(<SignupLoading />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-4');
  });

  it('should have accessible spinner text hidden visually but available to screen readers', () => {
    render(<SignupLoading />);

    const hiddenText = screen.getByText('Loading...');
    expect(hiddenText).toHaveClass('!absolute', '!-m-px', '!h-px', '!w-px', '!overflow-hidden');
  });

  it('should center content in viewport', () => {
    const { container } = render(<SignupLoading />);

    const textCenter = container.querySelector('.text-center');
    expect(textCenter).toBeInTheDocument();
  });

  it('should style loading message with correct text color', () => {
    render(<SignupLoading />);

    const loadingMessage = screen.getByText('Loading signup page...');
    expect(loadingMessage).toHaveClass('text-gray-600');
  });

  it('should apply margin to loading message', () => {
    render(<SignupLoading />);

    const loadingMessage = screen.getByText('Loading signup page...');
    expect(loadingMessage).toHaveClass('mt-4');
  });

  it('should render as paragraph element', () => {
    render(<SignupLoading />);

    const loadingMessage = screen.getByText('Loading signup page...');
    expect(loadingMessage.tagName).toBe('P');
  });
});
