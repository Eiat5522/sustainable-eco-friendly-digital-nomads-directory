const setupWorkerMock = jest.fn(() => ({ start: jest.fn() }));

jest.mock('msw/browser', () => ({
  setupWorker: (...args: unknown[]) => setupWorkerMock(...args),
}));

describe('MSW browser worker', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    setupWorkerMock.mockClear();
  });

  it('creates a worker with registered handlers', () => {
    const handlers = jest.requireActual('../../__mocks__/handlers');
    const { worker } = require('../browser');
    expect(worker).toHaveProperty('start');
    expect(setupWorkerMock).toHaveBeenCalledTimes(1);
    expect(setupWorkerMock.mock.calls[0]).toEqual(handlers.handlers);
  });
});
