import { jest } from '@jest/globals';

const dbConnect: jest.MockedFunction<() => Promise<void>> = jest.fn(async () => undefined);

export default dbConnect;
