import { jest } from '@jest/globals';

const mockConnect = jest.fn(async () => undefined);
const mockDisconnect = jest.fn(async () => undefined);
const mockReadyState = { value: 0 };

jest.mock('mongoose', () => {
  const connection = {
    get readyState() {
      return mockReadyState.value;
    },
    set readyState(value: number) {
      mockReadyState.value = value;
    },
  };

  return {
    __esModule: true,
    connection,
    connect: mockConnect,
    disconnect: mockDisconnect,
    default: {
      connection,
      connect: mockConnect,
      disconnect: mockDisconnect,
    },
  };
});

jest.mock('../../envLoader', () => ({
  getTestDbUri: jest.fn(),
}));

const { getTestDbUri } = jest.requireMock('../../envLoader') as { getTestDbUri: jest.Mock };

async function loadConnector() {
  return import('../testDbConnector');
}

describe('testDbConnector', () => {
  beforeEach(() => {
    mockReadyState.value = 0;
    mockConnect.mockReset();
    mockDisconnect.mockReset();
    mockConnect.mockImplementation(async () => undefined);
    mockDisconnect.mockImplementation(async () => undefined);
    getTestDbUri.mockReset();
  });

  it('throws when URI is missing', async () => {
    getTestDbUri.mockReturnValue(undefined);
    const { connectTestDb } = await loadConnector();

    await expect(connectTestDb()).rejects.toThrow('Test DB URI is not defined or invalid.');
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('reuses existing connection when already connected', async () => {
    getTestDbUri.mockReturnValue('mongodb://localhost:27017');
    mockReadyState.value = 1;
    const { connectTestDb } = await loadConnector();

    const result = await connectTestDb();

    expect(mockConnect).not.toHaveBeenCalled();
    expect(result).toHaveProperty('connect');
  });

  it('connects using validated URI when not already connected', async () => {
    getTestDbUri.mockReturnValue('mongodb://localhost:27017');
    mockConnect.mockResolvedValue(undefined);
    const { connectTestDb } = await loadConnector();

    const result = await connectTestDb();

    expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017', { dbName: 'test' });
    expect(result).toHaveProperty('connect');
  });

  it('disconnects only when a connection is active', async () => {
    const { disconnectTestDb } = await loadConnector();

    await disconnectTestDb();
    expect(mockDisconnect).not.toHaveBeenCalled();

    mockReadyState.value = 2;
    await disconnectTestDb();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
