import { jest } from '@jest/globals';

// Provide a stable mock function so tests can use mockResolvedValue / mockRejectedValue
const mockDbConnect = jest.fn().mockResolvedValue(undefined);

// For auto-mocking when jest.mock('@/lib/dbConnect') is called
const mock = () => mockDbConnect;

export default mockDbConnect;
module.exports = mockDbConnect;
module.exports.default = mockDbConnect;
