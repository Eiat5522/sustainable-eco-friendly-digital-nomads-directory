import { jest } from '@jest/globals';

const setupWorkerMock = jest.fn(() => ({ start: jest.fn() }));

jest.mock('msw/browser', () => ({
  setupWorker: setupWorkerMock,
}));

describe('msw browser worker', () => {
  it('creates the worker with the registered handlers', async () => {
    const module = await import('../browser');
    const { handlers } = await import('../../__mocks__/handlers');

    expect(setupWorkerMock).toHaveBeenCalledWith(...handlers);
    expect(module.worker).toEqual(expect.objectContaining({ start: expect.any(Function) }));
  });
});
