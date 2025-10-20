import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';
import { ALERT_SEVERITY } from '../alerting-thresholds';
import { __TEST_ONLY__, processMetricForAlert } from '../alert-service';

describe('alert-service', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let dateNowSpy: jest.SpyInstance;
  let randomSpy: jest.SpyInstance;
  let fetchMock: jest.Mock;
  let originalFetch: typeof globalThis.fetch | undefined;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    (__TEST_ONLY__ as { resetAlertHistory: () => void }).resetAlertHistory();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    fetchMock = jest.fn();
    originalFetch = globalThis.fetch;
    (globalThis as { fetch?: typeof globalThis.fetch }).fetch = fetchMock as unknown as typeof globalThis.fetch;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    randomSpy.mockRestore();
    dateNowSpy?.mockRestore();
    if (originalFetch) {
      (globalThis as { fetch?: typeof globalThis.fetch }).fetch = originalFetch;
    } else {
      delete (globalThis as { fetch?: unknown }).fetch;
    }
    originalFetch = undefined;
  });

  describe('processMetricForAlert', () => {
    it('returns null when the metric value is below configured thresholds', async () => {
      dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_710_000_000_000);

      const result = await processMetricForAlert('pageLoad', 'FCP', 1800, { source: 'test-suite' });

      expect(result).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('dispatches an alert when the metric exceeds the threshold', async () => {
      dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_710_000_000_000);

      const result = await processMetricForAlert('pageLoad', 'FCP', 4200, {
        source: 'lighthouse',
        url: '/sample',
      });

      expect(result).not.toBeNull();
      expect(result?.severity).toBe(ALERT_SEVERITY.ERROR);
      expect(result?.metricName).toBe('FCP');
      expect(result?.source).toBe('lighthouse');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance Alert][ERROR] pageLoad.FCP: 4200'),
        expect.objectContaining({ metricName: 'FCP' })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Would send email to'),
        expect.objectContaining({ metricName: 'FCP' })
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('enforces cooldown periods between repeated alerts', async () => {
      dateNowSpy = jest.spyOn(Date, 'now');

      dateNowSpy.mockReturnValue(0);
      const firstAlert = await processMetricForAlert('apiResponses', 'listings', 1200);
      expect(firstAlert).not.toBeNull();

      dateNowSpy.mockReturnValue(120_000); // 2 minutes later, still within 5 minute cooldown
      const secondAlert = await processMetricForAlert('apiResponses', 'listings', 1400);
      expect(secondAlert).toBeNull();

      dateNowSpy.mockReturnValue(400_000); // After cooldown expires
      const thirdAlert = await processMetricForAlert('apiResponses', 'listings', 1400);
      expect(thirdAlert).not.toBeNull();
    });
  });
});
