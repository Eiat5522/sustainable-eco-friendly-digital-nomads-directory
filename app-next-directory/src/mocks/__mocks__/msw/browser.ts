
export const setupWorker = jest.fn(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  use: jest.fn(),
  restoreHandlers: jest.fn(),
  printHandlers: jest.fn(),
}));
