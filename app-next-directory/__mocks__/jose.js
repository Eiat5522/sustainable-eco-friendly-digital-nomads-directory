module.exports = {
  compactDecrypt: jest.fn(() => ({
    plaintext: Buffer.from('mock-decrypted-data'),
  })),
  // Add other jose exports if needed by next-auth or openid-client
  // For example, if compactEncrypt is used:
  compactEncrypt: jest.fn(() => 'mock-encrypted-data'),
};
