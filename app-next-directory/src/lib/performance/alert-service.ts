export async function processMetricForAlert(
  metricData: { name: string; value: number; status: string },
  alertThreshold: number,
  alertType: string,
  callback?: () => void
): Promise<void> {
  try {
    console.log('Processing metric for alert:', metricData);

    if (metricData.value > alertThreshold) {
      console.warn(`Alert triggered for ${metricData.name}: ${metricData.value}`);

      if (callback) {
        callback();
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    console.error('Error processing metric for alert:', err);
    throw err;
  }
}
