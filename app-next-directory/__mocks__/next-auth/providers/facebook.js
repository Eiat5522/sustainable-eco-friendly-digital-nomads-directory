// Mock for @auth/core/providers/facebook and next-auth/providers/facebook
export default function Facebook(options = {}) {
  return {
    id: 'facebook',
    name: 'Facebook',
    type: 'oauth',
    options,
  };
}
