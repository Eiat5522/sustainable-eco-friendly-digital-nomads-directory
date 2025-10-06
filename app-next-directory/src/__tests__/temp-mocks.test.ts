import { generateToken } from '@/lib/tokens';
import { isEmailVerificationRequired } from '@/lib/auth/config';

describe('mock wiring sanity check', () => {
  it('exposes jest.fn mocks for tokens and auth config', () => {
    // eslint-disable-next-line no-console
    console.log('resolved tokens path:', require.resolve('@/lib/tokens'));
    console.log('generateToken typeof:', typeof generateToken);
    console.log('generateToken mock prop:', (generateToken as any).mock);
    console.log('isEmailVerificationRequired typeof:', typeof isEmailVerificationRequired);
    console.log('isEmailVerificationRequired mock prop:', (isEmailVerificationRequired as any).mock);
    const required = require('@/lib/tokens');
    console.log('required generateToken mock prop:', (required.generateToken as any).mock);
    console.log('imported === required?', generateToken === required.generateToken);
    const { fn } = require('jest-mock');
    const sample = fn();
    console.log('jest-mock sample mock prop:', sample.mock ? 'exists' : 'missing');
    console.log('descriptor of imported mock:', Object.getOwnPropertyDescriptor(generateToken, 'mock'));
    expect(typeof generateToken).toBe('function');
    expect((generateToken as any).mock).toBeDefined();
    expect(typeof isEmailVerificationRequired).toBe('function');
    expect((isEmailVerificationRequired as any).mock).toBeDefined();
  });
});
