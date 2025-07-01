import { renderHook, act, RenderHookResult } from '@testing-library/react-hooks';
import { RefObject } from 'react';
import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  it('should call the handler when clicking outside the ref', () => {
    const handler = jest.fn();
    const ref: RefObject<HTMLElement> = { current: document.createElement('div') };
    const { result }: RenderHookResult<any, any> = renderHook(() => useClickOutside(ref, handler));

    // Simulate a click outside the ref
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true,  }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call the handler when clicking inside the ref', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };
    const { result } = renderHook(() => useClickOutside(ref, handler));

    // Simulate a click inside the ref
    act(() => {
      ref.current?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true, }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call the handler if ref is null', () => {
    const handler = jest.fn();
    const ref = { current: null } as unknown as React.RefObject<HTMLElement>;
    const { result } = renderHook(() => useClickOutside(ref, handler));

    // Simulate a click outside the ref
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true, }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call the handler if ref is null and the event happens', () => {
    const handler = jest.fn();
    const ref = { current: null } as unknown as React.RefObject<HTMLElement>;
    const { result } = renderHook(() => useClickOutside(ref, handler));

    // Simulate a click outside the ref
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true, }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should cleanup event listener on unmount', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };
    const { result, unmount } = renderHook(() => useClickOutside(ref, handler));

    unmount();

    // Simulate a click outside the ref after unmount
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true, }));
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
