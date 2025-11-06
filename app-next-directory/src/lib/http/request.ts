import { logger } from '@/lib/logger';

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;
const DEFAULT_MIN_DELAY_MS = 300;
const DEFAULT_BACKOFF_FACTOR = 2;

export class RequestTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

export class HttpError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export interface RetryOptions {
  retries?: number;
  timeoutMs?: number;
  minDelayMs?: number;
  backoffFactor?: number;
  retryOnStatuses?: number[];
}

/**
 * Creates a promise that resolves after the specified delay in milliseconds.
 * Used in the retry mechanism to implement exponential backoff between attempts.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export async function withRequestTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  message = `Request timed out after ${timeoutMs}ms`
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new RequestTimeoutError(message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

export async function fetchWithTimeout(
  input: FetchInput,
  init: FetchInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const originalSignal = init?.signal;
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutId);
    if (originalSignal) {
      originalSignal.removeEventListener('abort', onAbort);
    }
  };

  const onAbort = () => {
    controller.abort();
  };

  if (originalSignal) {
    if (originalSignal.aborted) {
      controller.abort();
    } else {
      originalSignal.addEventListener('abort', onAbort);
    }
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    cleanup();
    return response;
  } catch (error) {
    cleanup();
    if (timedOut) {
      throw new RequestTimeoutError(`Request to ${typeof input === 'string' ? input : 'resource'} timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

function shouldRetry(error: unknown, response: Response | null, retryOnStatuses: number[]): boolean {
  if (response) {
    return retryOnStatuses.includes(response.status);
  }

  if (error instanceof RequestTimeoutError) {
    return true;
  }

  if (error instanceof TypeError) {
    // Fetch throws TypeError for network failures
    return true;
  }

  return false;
}

export async function fetchJsonWithRetry<T>(
  input: FetchInput,
  init: FetchInit = {},
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    minDelayMs = DEFAULT_MIN_DELAY_MS,
    backoffFactor = DEFAULT_BACKOFF_FACTOR,
    retryOnStatuses = [408, 425, 429, 500, 502, 503, 504],
  } = options;

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= retries) {
    let response: Response | null = null;
    try {
      response = await fetchWithTimeout(input, init, timeoutMs);

      if (!response.ok) {
        if (attempt < retries && shouldRetry(null, response, retryOnStatuses)) {
          throw new HttpError(`Request failed with status ${response.status}`, response.status);
        }

        const responseStatus = response?.status ?? 0;
        const errorBody = await response
          .json()
          .catch(() => ({ error: `Request failed with status ${responseStatus}` }));
        const message =
          typeof errorBody?.error === 'string'
            ? errorBody.error
            : `Request failed with status ${responseStatus}`;
        throw new HttpError(message, responseStatus);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const status = error instanceof HttpError ? error.status : null;
      const canRetry = attempt < retries && shouldRetry(error, response, retryOnStatuses);

      if (!canRetry) {
        if (status) {
          logger.error({ err: error, attempt, status, url: input }, 'HTTP request failed without retry');
        }
        throw error;
      }

      const delayMs = minDelayMs * Math.pow(backoffFactor, attempt);
      logger.warn({ err: error, attempt, url: input, delayMs }, 'Retrying HTTP request after failure');
      await delay(delayMs);
      attempt += 1;
    }
  }

  throw lastError ?? new Error('Request failed');
}

export function extractErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

export function getDefaultTimeout(): number {
  return DEFAULT_TIMEOUT_MS;
}
