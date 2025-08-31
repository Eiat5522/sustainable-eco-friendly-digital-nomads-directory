// Mock for @auth/core/providers/google and next-auth/providers/google
export default function Google(options = {}) {
  return {
    id: 'google',
    name: 'Google',
    type: 'oauth',
    options,
  };
}