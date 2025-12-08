// TypeScript empty shim for `thread-stream/test` imports used during bundling.
// This prevents test files and their dev-only deps from being pulled into the app bundle.
export function interceptTestApis(): () => void {
  return () => {};
}

export function wrapRequestHandler<T extends (...args: unknown[]) => unknown>(handler: T) {
  return (req: unknown, fn: unknown) => handler(req, fn);
}

export default {} as Record<string, unknown>;
