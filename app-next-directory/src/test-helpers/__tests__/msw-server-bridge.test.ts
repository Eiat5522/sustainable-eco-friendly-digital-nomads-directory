import { server as bridgeServer } from '../msw-server-bridge';
import { server as mockServer } from '../../../__mocks__/server';

describe('msw server bridge', () => {
  it('re-exports the shared MSW server instance', () => {
    expect(bridgeServer).toBe(mockServer);
  });
});
