import * as rl from '@/lib/rate-limit';
test('debug rate-limit shape', () => {
  // eslint-disable-next-line no-console
  console.log('RATE-LIMIT SHAPE:', {
    typeof_getClientIp: typeof rl.getClientIp,
    has_mockReturnValue: typeof (rl.getClientIp as any)?.mockReturnValue === 'function',
    isJestFn: !!(rl.getClientIp as any)?._isMockFunction,
    keys: Object.keys(rl),
  });
  expect(typeof rl.getClientIp).toBe('function');
});
