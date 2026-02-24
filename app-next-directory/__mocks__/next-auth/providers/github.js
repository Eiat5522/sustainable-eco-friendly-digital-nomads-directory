// Mock for @auth/core/providers/github and next-auth/providers/github
export default function GitHub(options = {}) {
  return {
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
    options,
  };
}
