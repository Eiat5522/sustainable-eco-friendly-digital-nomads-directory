import { server as bridgeServer } from '../msw-server-bridge';
import { server as mockServer } from '@/mocks/server';

describe('msw server bridge', () => {
  it('re-exports the shared MSW server instance', () => {
    expect(bridgeServer).toBe(mockServer);
  });
});
