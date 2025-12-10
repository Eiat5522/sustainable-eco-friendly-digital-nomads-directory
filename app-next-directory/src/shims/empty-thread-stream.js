// Lightweight shim to satisfy imports that would otherwise pull in
// test files from `thread-stream`. Export a minimal API used by the
// application's instrumentation so imports resolve safely during build.
export function interceptTestApis() {
  return () => {};
}
export function wrapRequestHandler(handler) {
  return (req, fn) => handler(req, fn);
}
const emptyShim = {};
export default emptyShim;
