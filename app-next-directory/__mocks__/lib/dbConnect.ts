import { jest } from '@jest/globals';

// Provide a stable mock function so tests can use mockResolvedValue / mockRejectedValue
const mockDbConnect = jest.fn(async () => ({}));

export default mockDbConnect;
