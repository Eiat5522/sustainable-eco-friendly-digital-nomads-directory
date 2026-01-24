import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactElement } from 'react';
import { createElement } from 'react';

type LoadingComponent = ComponentType<Record<string, never>> | ReactElement;

/**
 * Registers standard loading component tests within the current describe block.
 * Must be called inside a `describe()` block as it directly invokes `it()`.
 *
 * @param Component - A function component or ReactElement to test
 * @param expectedMessage - The loading message text expected to be rendered
 *
 * @example
 * describe('MyLoadingComponent', () => {
 *   testLoadingComponent(MyLoading, 'Loading data...');
 * });
 */
export function testLoadingComponent(Component: LoadingComponent, expectedMessage: string): void {
  const renderComponent = () => {
    if (typeof Component === 'function') {
      return render(createElement(Component));
    }
    return render(Component);
  };

  it('renders a status role spinner', () => {
    renderComponent();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('includes the visually hidden loading text', () => {
    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it(`shows the ${expectedMessage} text`, () => {
    renderComponent();
    expect(screen.getByText(expectedMessage)).toBeInTheDocument();
  });
}
