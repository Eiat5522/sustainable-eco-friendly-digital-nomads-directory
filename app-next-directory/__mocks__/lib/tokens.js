import { fn } from 'jest-mock';

export const generateToken = fn(() => ({ raw: 'test-token-raw', hash: 'test-token-hash' }));
export const hashToken = fn(() => 'test-hash');
export const minutesFromNow = fn(() => new Date(Date.now() + 60 * 60 * 1000));

const tokensMock = {
  generateToken,
  hashToken,
  minutesFromNow,
};

export default tokensMock;
