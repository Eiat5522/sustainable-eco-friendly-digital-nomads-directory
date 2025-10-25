import { jest } from '@jest/globals';

const mockWorker: Record<string, jest.Mock> = {
  start: jest.fn(),
  stop: jest.fn(),
  use: jest.fn(),
  restoreHandlers: jest.fn(),
  printHandlers: jest.fn(),
};

export type MockWorker = typeof mockWorker;

export const setupWorker: jest.Mock<() => MockWorker> = jest.fn(() => mockWorker);
