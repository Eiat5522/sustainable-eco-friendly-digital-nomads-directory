import { jest } from '@jest/globals';

const dbConnect = jest.fn().mockResolvedValue(undefined);

export default dbConnect;
