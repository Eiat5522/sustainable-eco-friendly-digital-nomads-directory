// Mock for @auth/core/providers/microsoft-entra-id
export default function MicrosoftEntraID(options = {}) {
  return {
    id: 'microsoft-entra-id',
    name: 'Microsoft',
    type: 'oauth',
    options,
  };
}