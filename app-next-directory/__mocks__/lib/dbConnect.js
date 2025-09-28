import { jest } from '@jest/globals'

const mockDbConnect = jest.fn().mockResolvedValue({
  readyState: 1,
  connection: { readyState: 1 },
});

export default mockDbConnect;
