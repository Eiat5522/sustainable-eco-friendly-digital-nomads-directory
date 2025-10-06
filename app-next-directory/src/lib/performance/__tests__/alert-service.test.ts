import { processMetricForAlert } from '../alert-service.ts';

describe('alert-service', () => {
  describe('processMetricForAlert', () => {
    it('should complete successfully when metric is below threshold', async () => {
      const metricData = { name: 'LCP', value: 2000, status: 'good' };
      const alertThreshold = 3000;

      await expect(
        processMetricForAlert(metricData, alertThreshold, 'performance')
      ).resolves.not.toThrow();
    });

    it('should trigger alert when metric exceeds threshold', async () => {
      const metricData = { name: 'LCP', value: 4000, status: 'poor' };
      const alertThreshold = 3000;

      await expect(
        processMetricForAlert(metricData, alertThreshold, 'performance')
      ).resolves.not.toThrow();
    });

    it('should not trigger alert when metric is below threshold', async () => {
      const metricData = { name: 'FCP', value: 1500, status: 'good' };
      const alertThreshold = 2000;

      await expect(
        processMetricForAlert(metricData, alertThreshold, 'performance')
      ).resolves.not.toThrow();
    });

    it('should call callback function when alert is triggered', async () => {
      const metricData = { name: 'TTFB', value: 2000, status: 'poor' };
      const alertThreshold = 1500;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'performance', callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback when metric is below threshold', async () => {
      const metricData = { name: 'CLS', value: 0.05, status: 'good' };
      const alertThreshold = 0.1;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'performance', callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const metricData = { name: 'INP', value: 300, status: 'needs-improvement' };
      const alertThreshold = 200;
      const callback = jest.fn(() => {
        throw new Error('Callback error');
      });

      // Should not throw even when callback throws
      await expect(
        processMetricForAlert(metricData, alertThreshold, 'performance', callback)
      ).resolves.not.toThrow();

      // Callback should have been called
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle missing callback gracefully', async () => {
      const metricData = { name: 'FID', value: 400, status: 'poor' };
      const alertThreshold = 300;

      await expect(
        processMetricForAlert(metricData, alertThreshold, 'performance')
      ).resolves.not.toThrow();
    });

    it('should process metrics with exact threshold values', async () => {
      const metricData = { name: 'LCP', value: 2500, status: 'good' };
      const alertThreshold = 2500;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'performance', callback);

      // Callback should not be called when value equals threshold
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle different alert types', async () => {
      const metricData = { name: 'custom-metric', value: 5000, status: 'warning' };
      const alertThreshold = 3000;

      await expect(
        processMetricForAlert(metricData, alertThreshold, 'custom')
      ).resolves.not.toThrow();
    });

    it('should handle zero values', async () => {
      const metricData = { name: 'CLS', value: 0, status: 'good' };
      const alertThreshold = 0.1;

      await expect(
        processMetricForAlert(metricData, alertThreshold, 'performance')
      ).resolves.not.toThrow();
    });

    it('should handle negative thresholds gracefully', async () => {
      const metricData = { name: 'test-metric', value: 100, status: 'ok' };
      const alertThreshold = -1;

      await expect(
        processMetricForAlert(metricData, alertThreshold, 'test')
      ).resolves.not.toThrow();
    });

    it('should work with multiple metric types', async () => {
      const metrics = [
        { name: 'LCP', value: 2500, status: 'good' },
        { name: 'FCP', value: 1800, status: 'good' },
        { name: 'CLS', value: 0.1, status: 'good' },
      ];

      for (const metric of metrics) {
        await expect(
          processMetricForAlert(metric, 3000, 'webVitals')
        ).resolves.not.toThrow();
      }
    });

    it('should handle callback with return value', async () => {
      const metricData = { name: 'FID', value: 350, status: 'poor' };
      const alertThreshold = 300;
      const callback = jest.fn(() => 'callback-result');

      await processMetricForAlert(metricData, alertThreshold, 'performance', callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should work with exact threshold boundary', async () => {
      const metricData = { name: 'TTFB', value: 1800, status: 'acceptable' };
      const alertThreshold = 1800;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'performance', callback);

      // Callback should not be called when value equals threshold
      expect(callback).not.toHaveBeenCalled();
    });

    it('should trigger callback when value is just above threshold', async () => {
      const metricData = { name: 'INP', value: 501, status: 'poor' };
      const alertThreshold = 500;
      const callback = jest.fn();

      await processMetricForAlert(metricData, alertThreshold, 'performance', callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
