// TypeScript empty shim for `thread-stream/test` imports used during bundling.
// This prevents test files and their dev-only deps from being pulled into the app bundle.
export function interceptTestApis(): () => void {
  return () => {};
}

export function wrapRequestHandler<T extends (...args: any[]) => any>(handler: T) {
  return (req: any, fn: any) => handler(req, fn);
}

export default {} as Record<string, unknown>;
