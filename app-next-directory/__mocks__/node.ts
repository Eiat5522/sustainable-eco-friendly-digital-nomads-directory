// Ensure globals exist before MSW loads
// eslint-disable-next-line @typescript-eslint/no-var-requires
const crossFetch = require('cross-fetch');
;(global as any).fetch = (global as any).fetch || crossFetch.fetch || crossFetch.default;
;(global as any).Request = (global as any).Request || crossFetch.Request;
;(global as any).Response = (global as any).Response || crossFetch.Response;
;(global as any).Headers = (global as any).Headers || crossFetch.Headers;

let server: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  server = require('./server').server;
} catch (_e) {}

if (server) {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
