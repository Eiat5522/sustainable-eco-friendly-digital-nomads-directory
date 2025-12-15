import { render, waitFor } from '@testing-library/react';
import { structuredLogger } from '@/lib/logger';
import MswInit from '../MswInit';

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the browser worker
const mockStart = jest.fn();
jest.mock('../../mocks/browser', () => ({
  worker: {
    start: mockStart,
  },
}));

describe('MswInit', () => {
  const originalEnv = process.env;
  const originalPwE2e = (globalThis as { __PW_E2E__?: boolean }).__PW_E2E__;

  beforeEach(() => {
    jest.resetModules();
    mockStart.mockClear();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (globalThis as { __PW_E2E__?: boolean }).__PW_E2E__ = originalPwE2e;
  });

  afterAll(() => {
    process.env = originalEnv;
    (globalThis as { __PW_E2E__?: boolean }).__PW_E2E__ = originalPwE2e;
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
    expect(structuredLogger.info).toHaveBeenCalledWith(
      '[MSW] Browser worker started for Playwright tests',
      { component: 'msw' }
    );
  });

  it('should start the worker if __PW_E2E__ is true', async () => {
    (globalThis as { __PW_E2E__?: boolean }).__PW_E2E__ = true;
    mockStart.mockResolvedValueOnce(undefined);
    render(<MswInit />);

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledWith({ onUnhandledRequest: 'bypass' });
    });
    expect(structuredLogger.info).toHaveBeenCalledWith(
      '[MSW] Browser worker started for Playwright tests',
      { component: 'msw' }
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
    expect(structuredLogger.warn).toHaveBeenCalledWith('[MSW] Failed to start worker', {
      component: 'msw',
      err: error.message,
    });
  });
});
