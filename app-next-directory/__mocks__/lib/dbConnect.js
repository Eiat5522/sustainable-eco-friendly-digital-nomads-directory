import jestGlobals from '@jest/globals';

const { jest } = jestGlobals;

const mockDbConnect = jest.fn().mockResolvedValue({
  readyState: 1,
  connection: { readyState: 1 },
});

export default mockDbConnect;
