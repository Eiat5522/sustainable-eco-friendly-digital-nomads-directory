import { processMetricForAlert } from '../alert-service.ts';

describe('alert-service', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('processMetricForAlert', () => {
    it('should process metric without triggering alert when value is below threshold', async () => {
      const metricData = { name: 'test-metric', value: 50, status: 'ok' };
      const alertThreshold = 100;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'test', callback);

      expect(consoleLogSpy).toHaveBeenCalledWith('Processing metric for alert:', metricData);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should trigger alert when value exceeds threshold', async () => {
      const metricData = { name: 'test-metric', value: 150, status: 'warning' };
      const alertThreshold = 100;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'test', callback);

      expect(consoleLogSpy).toHaveBeenCalledWith('Processing metric for alert:', metricData);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Alert triggered for test-metric: 150');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should trigger alert when value equals threshold', async () => {
      const metricData = { name: 'threshold-test', value: 100, status: 'ok' };
      const alertThreshold = 100;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'equal', callback);

      expect(consoleLogSpy).toHaveBeenCalledWith('Processing metric for alert:', metricData);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should work without callback function', async () => {
      const metricData = { name: 'no-callback', value: 150, status: 'error' };
      const alertThreshold = 100;

      await expect(
        processMetricForAlert(metricData, alertThreshold, 'test')
      ).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith('Alert triggered for no-callback: 150');
    });

    it('should handle different metric values correctly', async () => {
      const testCases = [
        { value: 0, threshold: 100, shouldAlert: false },
        { value: 99, threshold: 100, shouldAlert: false },
        { value: 101, threshold: 100, shouldAlert: true },
        { value: 200, threshold: 100, shouldAlert: true },
      ];

      const callback = jest.fn();

      for (const testCase of testCases) {
        callback.mockClear();
        consoleWarnSpy.mockClear();

        await processMetricForAlert(
          { name: 'test', value: testCase.value, status: 'ok' },
          testCase.threshold,
          'test',
          callback
        );

        if (testCase.shouldAlert) {
          expect(callback).toHaveBeenCalled();
          expect(consoleWarnSpy).toHaveBeenCalled();
        } else {
          expect(callback).not.toHaveBeenCalled();
          expect(consoleWarnSpy).not.toHaveBeenCalled();
        }
      }
    });

    it('should handle errors gracefully', async () => {
      const metricData = { name: 'error-test', value: 150, status: 'error' };
      const alertThreshold = 100;
      const callback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      // Should throw since callback throws
      await expect(
        processMetricForAlert(metricData, alertThreshold, 'test', callback)
      ).rejects.toThrow();
    });

    it('should handle different alert types', async () => {
      const metricData = { name: 'type-test', value: 150, status: 'critical' };
      const alertThreshold = 100;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'critical-alert', callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should handle negative values', async () => {
      const metricData = { name: 'negative-test', value: -10, status: 'ok' };
      const alertThreshold = 100;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'test', callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle zero threshold', async () => {
      const metricData = { name: 'zero-threshold', value: 1, status: 'ok' };
      const alertThreshold = 0;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'test', callback);

      expect(callback).toHaveBeenCalled();
    });
  });
});
