/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { testLoadingComponent } from '@/test-utils';
import SignupLoading from '../loading';

describe('SignupLoading', () => {
  testLoadingComponent(SignupLoading, 'Loading signup page...');

  it('should wrap spinner and message in a visible layout container', () => {
    const { container } = render(<SignupLoading />);

    const mainDiv = container.firstChild as HTMLElement;
    const loadingMessage = screen.getByText('Loading signup page...');

    expect(mainDiv).toContainElement(screen.getByRole('status'));
    expect(mainDiv).toContainElement(loadingMessage);
  });

  it('should render as paragraph element', () => {
    render(<SignupLoading />);

    const loadingMessage = screen.getByText('Loading signup page...');
    expect(loadingMessage.tagName).toBe('P');
  });
});
