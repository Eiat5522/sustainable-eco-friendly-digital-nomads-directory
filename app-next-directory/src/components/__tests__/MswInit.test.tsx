import { render, waitFor } from '@testing-library/react';
import MswInit from '../MswInit';

// Mock the browser worker
const mockStart = jest.fn();
jest.mock('../../mocks/browser', () => ({
  worker: {
    start: mockStart,
  },
}));

// Mock console.log and console.warn to spy on them
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('MswInit', () => {
  const originalEnv = process.env;
  const originalPwE2e = (globalThis as any).__PW_E2E__;

  beforeEach(() => {
    jest.resetModules();
    mockStart.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
    process.env = { ...originalEnv };
    (globalThis as any).__PW_E2E__ = originalPwE2e;
  });

  afterAll(() => {
    process.env = originalEnv;
    (globalThis as any).__PW_E2E__ = originalPwE2e;
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  it('should render null', () => {
    const { container } = render(<MswInit />);
    expect(container.firstChild).toBeNull();
  });

  it('should not start the worker if NEXT_PUBLIC_E2E is not "1" and __PW_E2E__ is not set', () => {
    render(<MswInit />);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('should start the worker if NEXT_PUBLIC_E2E is "1"', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    mockStart.mockResolvedValueOnce(undefined);
    render(<MswInit />);

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledWith({ onUnhandledRequest: 'bypass' });
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[MSW] Browser worker started for Playwright tests'
    );
  });

  it('should start the worker if __PW_E2E__ is true', async () => {
    (globalThis as any).__PW_E2E__ = true;
    mockStart.mockResolvedValueOnce(undefined);
    render(<MswInit />);

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledWith({ onUnhandledRequest: 'bypass' });
    });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[MSW] Browser worker started for Playwright tests'
    );
  });

  it('should log a warning if the worker fails to start', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    const error = new Error('Failed to start');
    mockStart.mockRejectedValueOnce(error);
    render(<MswInit />);

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });
    expect(mockConsoleWarn).toHaveBeenCalledWith('[MSW] Failed to start worker:', error);
  });
});
