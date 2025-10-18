
import { setupWorker } from 'msw/browser';
describe('MSW browser worker', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('creates a worker with registered handlers', () => {
    const handlers = jest.requireActual('../../__mocks__/handlers');
    const { worker } = require('../browser');
    expect(worker).toHaveProperty('start');
    expect(setupWorker).toHaveBeenCalledTimes(1);
    expect(setupWorker.mock.calls[0]).toEqual(handlers.handlers);
  });
});
