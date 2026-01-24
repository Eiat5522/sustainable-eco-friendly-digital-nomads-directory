/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LoginLoading from '../loading';
import { testLoadingComponent } from '@/test-utils';

describe('LoginLoading', () => {
  testLoadingComponent(LoginLoading, 'Loading login page...');

  it('should wrap spinner and message in a visible layout container', () => {
    const { container } = render(<LoginLoading />);

    const mainDiv = container.firstChild as HTMLElement;
    const loadingMessage = screen.getByText('Loading login page...');

    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toContainElement(screen.getByRole('status'));
    expect(mainDiv).toContainElement(loadingMessage);
  });

  it('should render as paragraph element', () => {
    render(<LoginLoading />);

    const loadingMessage = screen.getByText('Loading login page...');
    expect(loadingMessage.tagName).toBe('P');
  });
});
