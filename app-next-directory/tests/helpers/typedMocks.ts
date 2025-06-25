// Robust, type-safe mock helpers for Jest and TypeScript.

type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
    : T[K];
};

/**
 * Creates a fully type-safe mock of an object/class.
 */
export function createTypedMock<T>(): Mocked<T> {
  return {} as Mocked<T>;
}

/**
 * Casts an existing object to a type-safe mock.
 */
export function asTypedMock<T>(obj: T): Mocked<T> {
  return obj as unknown as Mocked<T>;
}

/**
 * Example usage:
 * const mockResponse = createTypedMock<Response>();
 * mockResponse.json.mockReturnValue({ foo: 'bar' });
 */