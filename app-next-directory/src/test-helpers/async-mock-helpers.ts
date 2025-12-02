/**
 * Reusable helper function for testing Next.js 16 async route props.
 * 
 * In Next.js 16, page components receive `params` and `searchParams` as Promises.
 * This helper wraps a given value in an immediately resolving Promise to standardize
 * the creation of asynchronous mock data in tests.
 * 
 * @template T - The type of the value to wrap
 * @param value - The value to wrap in a Promise
 * @returns A Promise that immediately resolves with the provided value
 * 
 * @example
 * ```typescript
 * // Testing a page component with params
 * const mockParams = { slug: "test-listing" };
 * const pagePromise = ListingPage({
 *   params: generateAsyncValue(mockParams),
 * });
 * const PageComponent = await pagePromise;
 * render(PageComponent);
 * ```
 * 
 * @example
 * ```typescript
 * // Testing a page component with searchParams
 * const mockSearchParams = { page: "2", limit: "12" };
 * const pagePromise = SearchPage({
 *   searchParams: generateAsyncValue(mockSearchParams),
 * });
 * const PageComponent = await pagePromise;
 * render(PageComponent);
 * ```
 */
export async function generateAsyncValue<T>(value: T): Promise<T> {
  return value;
}
