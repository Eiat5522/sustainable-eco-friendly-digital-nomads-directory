// TypeScript shim replacing the real `thread-stream` implementation for bundling.
// Provide a minimal, safe fallback used by server-side packages like `pino`.
export class ThreadStream {
  options: Record<string, unknown>;
  constructor(options?: Record<string, unknown>) {
    this.options = options ?? {};
  }
  write(..._args: unknown[]) {
    // no-op
  }
  end(..._args: unknown[]) {
    // no-op
  }
}

export function createThreadStream(options?: Record<string, unknown>): ThreadStream {
  return new ThreadStream(options);
}

export default ThreadStream;
