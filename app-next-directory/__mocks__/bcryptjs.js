const bcrypt = {
  compare: jest.fn(),
  hash: jest.fn(),
};

module.exports = bcrypt;
module.exports.default = bcrypt;