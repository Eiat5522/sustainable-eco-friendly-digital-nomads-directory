// Jest unit tests for authOptions callbacks in [`auth.ts`](app-next-directory/src/lib/auth.ts:17)

import authOptions from '../auth';

describe('authOptions.callbacks', () => {
  describe('jwt', () => {
    it('adds user role to token if user is present', async () => {
      const token = {};
      const user = { role: 'admin' };
      const result = await authOptions.callbacks.jwt({ token, user });
      expect(result.role).toBe('admin');
    });

    it('defaults role to "user" if user has no role', async () => {
      const token = {};
      const user = {};
      const result = await authOptions.callbacks.jwt({ token, user });
      expect(result.role).toBe('user');
    });

    it('does not modify token if user is not present', async () => {
      const token = { foo: 'bar' };
      const result = await authOptions.callbacks.jwt({ token });
      expect(result).toEqual({ foo: 'bar' });
    });
  });

  describe('session', () => {
    it('adds id and role to session.user if token and session.user exist', async () => {
      const session = { user: {} };
      const token = { sub: '123', role: 'admin' };
      const result = await authOptions.callbacks.session({ session, token });
      expect(result.user.id).toBe('123');
      expect(result.user.role).toBe('admin');
    });

    it('defaults role to "user" if token.role is missing', async () => {
      const session = { user: {} };
      const token = { sub: '123' };
      const result = await authOptions.callbacks.session({ session, token });
      expect(result.user.role).toBe('user');
    });

    it('returns session unchanged if session.user is missing', async () => {
      const session = {};
      const token = { sub: '123', role: 'admin' };
      const result = await authOptions.callbacks.session({ session, token });
      expect(result).toEqual(session);
    });
  });
});
