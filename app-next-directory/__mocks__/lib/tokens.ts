import { jest } from '@jest/globals';

export const generateToken = jest.fn();
export const hashToken = jest.fn();
export const minutesFromNow = jest.fn();

// Setup default returns
generateToken.mockReturnValue({ raw: 'test-token-raw', hash: 'test-token-hash' });
hashToken.mockReturnValue('test-hash');
minutesFromNow.mockReturnValue(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour from now