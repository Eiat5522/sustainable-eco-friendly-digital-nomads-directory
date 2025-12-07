// TypeScript shim replacing the real `thread-stream` implementation for bundling.
// Provide a minimal, safe fallback used by server-side packages like `pino`.
export class ThreadStream {
  options: any;
  constructor(options?: any) {
    this.options = options;
  }
  write(..._args: any[]) {
    // no-op
  }
  end(..._args: any[]) {
    // no-op
  }
}

export function createThreadStream(options?: any): ThreadStream {
  return new ThreadStream(options);
}

export default ThreadStream;
