import { jest } from '@jest/globals';

// Mock a mongoose-like object that passes validation
const mockMongoose = {
  readyState: 1, // 1 = connected
  connection: {
    readyState: 1
  }
};

// Provide a stable mock function so tests can use mockResolvedValue / mockRejectedValue
const mockDbConnect = jest.fn().mockResolvedValue(mockMongoose);

export default mockDbConnect;
