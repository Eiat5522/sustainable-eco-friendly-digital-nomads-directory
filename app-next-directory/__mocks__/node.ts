import { server } from './server';

// Skip MSW setup for integration tests that use real mongoose/mongodb
const skipMSW = process.env.JEST_USE_REAL_MONGOOSE === '1';

if (!skipMSW) {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
