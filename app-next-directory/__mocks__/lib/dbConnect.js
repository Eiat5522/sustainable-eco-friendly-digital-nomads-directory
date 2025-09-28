const { jest } = require('@jest/globals');

const mockDbConnect = jest.fn().mockResolvedValue({
  readyState: 1,
  connection: { readyState: 1 },
});

module.exports = mockDbConnect;
