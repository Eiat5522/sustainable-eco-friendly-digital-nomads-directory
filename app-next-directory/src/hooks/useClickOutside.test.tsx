/** @jest-environment jsdom */
import React, { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useClickOutside } from './useClickOutside';

// Test component to use the hook in a real DOM tree
function TestComponent({ handler }: { handler: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref as React.RefObject<HTMLElement>, handler);
  return <div data-testid="outside"><div ref={ref} data-testid="inside" /></div>;
}

describe('useClickOutside', () => {
  it('should call the handler when clicking outside the ref', () => {
    const handler = jest.fn();
    const { getByTestId } = render(<TestComponent handler={handler} />);
    fireEvent.mouseDown(document.body);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call the handler when clicking inside the ref', () => {
    const handler = jest.fn();
    const { getByTestId } = render(<TestComponent handler={handler} />);
    fireEvent.mouseDown(getByTestId('inside'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call the handler if ref is null', () => {
    // Simulate null ref by not rendering the inside div
    function NullRefComponent({ handler }: { handler: () => void }) {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref as React.RefObject<HTMLElement>, handler);
      return <div data-testid="outside" />;
    }
    const handler = jest.fn();
    render(<NullRefComponent handler={handler} />);
    fireEvent.mouseDown(document.body);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should cleanup event listener on unmount', () => {
    const handler = jest.fn();
    const { unmount } = render(<TestComponent handler={handler} />);
    unmount();
    fireEvent.mouseDown(document.body);
    expect(handler).not.toHaveBeenCalled();
  });
});
