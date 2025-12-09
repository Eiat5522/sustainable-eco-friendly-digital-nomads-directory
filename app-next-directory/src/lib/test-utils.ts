/**
 * Helpers that mimic Next.js 16's async route data when writing unit tests.
 */

/**
 * Wraps a value in a resolved promise so tests can imitate the runtime `params`
 * or `searchParams` props that Next.js now provides as promises.
 */
export const asyncProps = <T>(value: T): Promise<T> => Promise.resolve(value);

/**
 * Alias to make intent clearer when providing mocked route params.
 */
export const asyncParams = asyncProps;

/**
 * Alias to make intent clearer when providing mocked search params.
 */
export const asyncSearchParams = asyncProps;
