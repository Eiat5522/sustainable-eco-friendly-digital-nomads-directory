// Mock for @auth/core/providers/twitter and next-auth/providers/twitter
export default function Twitter(options = {}) {
  return {
    id: 'twitter',
    name: 'Twitter',
    type: 'oauth',
    options,
  };
}