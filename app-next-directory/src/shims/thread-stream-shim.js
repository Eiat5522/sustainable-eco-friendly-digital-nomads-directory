// Minimal shim for `thread-stream` used to satisfy imports during build.
// Provide the small API surface the app expects; keep behavior no-op.
export class ThreadStream {
  constructor(options) {
    this.options = options;
  }
  write() {}
  end() {}
}

export function interceptTestApis() {
  return () => {};
}

export function wrapRequestHandler(handler) {
  return (req, fn) => handler(req, fn);
}

export default ThreadStream;
