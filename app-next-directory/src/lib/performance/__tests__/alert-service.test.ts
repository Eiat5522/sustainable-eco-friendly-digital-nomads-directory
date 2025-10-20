import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  ALERT_DESTINATION_CONFIG,
  ALERTING_THRESHOLDS,
  ALERT_SEVERITY,
  NOTIFICATION_CHANNELS,
} from '../alerting-thresholds';
import { __TEST_ONLY__, processMetricForAlert } from '../alert-service';

describe('performance alert service', () => {
  let originalEnv: string | undefined;
  let originalFetch: typeof globalThis.fetch | undefined;
  let fetchMock: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let dateNowSpy: jest.SpyInstance<number, []>;
  let randomSpy: jest.SpyInstance<number, []>;
  let originalSlackWebhook: string | undefined;
  let originalSlackChannel: string | undefined;
  let originalWebhookUrl: string | undefined;
  let originalWebhookMethod: string | undefined;
  let originalFcpDestinations = ALERTING_THRESHOLDS.pageLoad.FCP.destinations;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    fetchMock = jest.fn();
    originalFetch = globalThis.fetch;
    (globalThis as { fetch?: typeof globalThis.fetch }).fetch = fetchMock as unknown as typeof globalThis.fetch;

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const slackConfig = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.SLACK];
    originalSlackWebhook = slackConfig.webhook;
    originalSlackChannel = slackConfig.channel;
    const webhookConfig = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.WEBHOOK];
    originalWebhookUrl = webhookConfig.url;
    originalWebhookMethod = webhookConfig.method;

    originalFcpDestinations = ALERTING_THRESHOLDS.pageLoad.FCP.destinations;

    __TEST_ONLY__.resetAlertHistory();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;

    if (originalFetch) {
      (globalThis as { fetch?: typeof globalThis.fetch }).fetch = originalFetch;
    } else {
      delete (globalThis as { fetch?: unknown }).fetch;
    }

    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    dateNowSpy.mockRestore();
    randomSpy.mockRestore();

    const slackConfig = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.SLACK];
    slackConfig.webhook = originalSlackWebhook;
    if (originalSlackChannel) {
      slackConfig.channel = originalSlackChannel;
    }

    const webhookConfig = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.WEBHOOK];
    webhookConfig.url = originalWebhookUrl;
    if (originalWebhookMethod) {
      webhookConfig.method = originalWebhookMethod;
    }

    ALERTING_THRESHOLDS.pageLoad.FCP.destinations = originalFcpDestinations;
  });

  it('returns null when the metric does not breach thresholds', async () => {
    const result = await processMetricForAlert('pageLoad', 'FCP', 2000);

    expect(result).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('dispatches alerts with merged context and deterministic identifiers', async () => {
    const result = await processMetricForAlert('pageLoad', 'FCP', 4200, {
      page: '/destinations',
      source: 'lighthouse',
    });

    expect(result).not.toBeNull();
    expect(result?.severity).toBe(ALERT_SEVERITY.ERROR);
    expect(result?.context.url).toBe('/destinations');
    expect(result?.context.timestamp).toBe(1_700_000_000_000);
    expect(result?.id).toBe('perf-1700000000000-4fzzzxjy');
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

  it('respects cooldown windows before creating new alerts', async () => {
    dateNowSpy.mockReturnValueOnce(0);
    const initialAlert = await processMetricForAlert('apiResponses', 'listings', 1200);
    expect(initialAlert).not.toBeNull();

    dateNowSpy.mockReturnValueOnce(120_000);
    const suppressed = await processMetricForAlert('apiResponses', 'listings', 1300);
    expect(suppressed).toBeNull();

    dateNowSpy.mockReturnValueOnce(400_000);
    const afterCooldown = await processMetricForAlert('apiResponses', 'listings', 1300);
    expect(afterCooldown).not.toBeNull();
  });

  it('sends Slack and webhook notifications in production when endpoints are configured', async () => {
    process.env.NODE_ENV = 'production';
    const slackConfig = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.SLACK];
    slackConfig.webhook = 'https://hooks.slack.test';
    slackConfig.channel = '#alerts';
    const webhookConfig = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.WEBHOOK];
    webhookConfig.url = 'https://alerts.test/perf';
    webhookConfig.method = 'PUT';

    ALERTING_THRESHOLDS.pageLoad.FCP.destinations = {
      ...originalFcpDestinations,
      [ALERT_SEVERITY.ERROR]: [
        ...(originalFcpDestinations?.[ALERT_SEVERITY.ERROR] ?? []),
        NOTIFICATION_CHANNELS.WEBHOOK,
      ],
    };

    fetchMock.mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });

    const alert = await processMetricForAlert('pageLoad', 'FCP', 3600, { source: 'runtime' });

    expect(alert).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://hooks.slack.test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://alerts.test/perf',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(alert),
      })
    );
  });

  it('returns null when dispatching a channel throws an error', async () => {
    consoleErrorSpy.mockImplementationOnce(() => {
      throw new Error('logger failure');
    });

    const result = await processMetricForAlert('pageLoad', 'FCP', 4200);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Alert Service] Error dispatching alert:',
      expect.any(Error)
    );
  });
});
