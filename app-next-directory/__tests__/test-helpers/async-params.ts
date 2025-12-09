/**
 * Test helpers for Next.js 16+ async route props
 * 
 * In Next.js 16, page components receive params and searchParams as Promises.
 * These helpers simplify creating async mock data for testing.
 */

/**
 * Wraps a value in an immediately resolving Promise.
 * Use this to create async params for testing page components.
 * 
 * @example
 * ```ts
 * const mockParams = generateAsyncValue({ slug: '456' });
 * const PageComponent = await UserProfilePage({ params: mockParams });
 * ```
 */
export async function generateAsyncValue<T>(value: T): Promise<T> {
  return value;
}

/**
 * Helper to create async params object for page component tests.
 * 
 * @example
 * ```ts
 * const element = await MyPage({ params: asyncParams({ slug: 'test' }) });
 * ```
 */
export function asyncParams<T extends Record<string, any>>(value: T): Promise<T> {
  return Promise.resolve(value);
}

/**
 * Helper to create async searchParams object for page component tests.
 * 
 * @example
 * ```ts
 * const element = await MyPage({ searchParams: asyncSearchParams({ query: 'test' }) });
 * ```
 */
export function asyncSearchParams<T extends Record<string, any>>(value: T): Promise<T> {
  return Promise.resolve(value);
}
