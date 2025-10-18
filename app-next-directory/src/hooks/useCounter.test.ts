import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  let callbacks: FrameRequestCallback[];
  let requestAnimationFrameSpy: jest.SpyInstance<number, [FrameRequestCallback]>;
  let cancelAnimationFrameSpy: jest.SpyInstance<void, [number]>;
  let nowSpy: jest.SpyInstance<number, []>;

  const runNextFrame = (timestamp: number) => {
    const next = callbacks.shift();
    if (!next) {
      throw new Error('No queued animation frame');
    }
    act(() => {
      next(timestamp);
    });
  };

  beforeEach(() => {
    callbacks = [];
    nowSpy = jest.spyOn(performance, 'now').mockImplementation(() => 0);
    requestAnimationFrameSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        callbacks.push(cb);
        return callbacks.length;
      });
    cancelAnimationFrameSpy = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
    nowSpy.mockRestore();
  });

  it('animates from the start to the end value using the default easing', () => {
    const { result, unmount } = renderHook(() => useCounter({ start: 10, end: 20, duration: 1000 }));

    expect(result.current.value).toBe(10);
    expect(result.current.formatted).toBe('10');
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);

    runNextFrame(0);
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2);

    runNextFrame(500);
    expect(result.current.value).toBeCloseTo(18.75, 2);

    runNextFrame(1000);
    expect(result.current.value).toBe(20);
    expect(result.current.formatted).toBe('20');

    unmount();
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });

  it('formats the value with the requested number of decimal places', () => {
    const { result } = renderHook(() =>
      useCounter({ start: 0, end: 1, duration: 1000, decimals: 2, easing: (t) => t })
    );

    runNextFrame(0);
    runNextFrame(250);
    expect(result.current.formatted).toBe('0.25');

    runNextFrame(1000);
    expect(result.current.formatted).toBe('1.00');
  });

  it('only animates once when the once flag is set', () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useCounter>[0]) => useCounter(props),
      {
        initialProps: { start: 0, end: 50, duration: 500, once: true, easing: (t: number) => t },
      }
    );

    runNextFrame(0);
    runNextFrame(500);
    expect(result.current.formatted).toBe('50');
    const callsAfterFirstRun = requestAnimationFrameSpy.mock.calls.length;

    rerender({ start: 0, end: 100, duration: 500, once: true, easing: (t: number) => t });
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(callsAfterFirstRun);
  });
});
