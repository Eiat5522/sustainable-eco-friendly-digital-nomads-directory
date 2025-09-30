const { jest } = require('@jest/globals');

const isEmailVerificationRequired = jest.fn(() => false);

const exported = {
  isEmailVerificationRequired,
};

module.exports = { __esModule: true, default: exported, isEmailVerificationRequired };
exports.isEmailVerificationRequired = isEmailVerificationRequired;
