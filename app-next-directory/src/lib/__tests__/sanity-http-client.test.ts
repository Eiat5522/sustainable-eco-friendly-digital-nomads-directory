import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { structuredLogger } from '@/lib/logger';

jest.mock('@/lib/logger');

const loggerMock = jest.mocked(structuredLogger);

const REQUIRED_ENV = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project-id',
  NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
  SANITY_API_TOKEN: 'test-api-token',
};

const mockCreateClient = jest.fn((config: { token?: string }) =>
  mockCreateClient.mock.calls.length === 0 || !config.token ? mockReadClient : mockWriteClient
) as jest.Mock<any>;
const mockCommit = jest.fn() as jest.Mock<any>;
const mockSet = jest.fn(() => ({ commit: mockCommit })) as jest.Mock<any>;
const mockPatch = jest.fn(() => ({ set: mockSet })) as jest.Mock<any>;
const mockTransactionCreate = jest.fn() as jest.Mock<any>;
const mockTransactionCommit = jest.fn() as jest.Mock<any>;
const mockTransaction = jest.fn(() => ({
  create: mockTransactionCreate,
  commit: mockTransactionCommit,
})) as jest.Mock<any>;
const mockReadClient = {
  fetch: jest.fn() as jest.Mock<any>,
  withConfig: jest.fn() as jest.Mock<any>,
};
const mockWriteClient = {
  create: jest.fn() as jest.Mock<any>,
  delete: jest.fn() as jest.Mock<any>,
  assets: { upload: jest.fn() as jest.Mock<any> },
  patch: mockPatch,
  transaction: mockTransaction,
};

jest.mock('../sanity/client', () => ({
  createClient: mockCreateClient,
}));

const loadModule = async () => {
  let clientModule: typeof import('../sanity-http-client');
  await jest.isolateModulesAsync(async () => {
    clientModule = await import('../sanity-http-client');
  });
  return clientModule!;
};

describe('SanityHTTPClient', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, ...REQUIRED_ENV };

    jest.clearAllMocks();
    mockCreateClient.mockClear();
    mockSet.mockReturnValue({ commit: mockCommit });
    mockPatch.mockReturnValue({ set: mockSet });
    mockCommit.mockResolvedValue({ _id: 'patched-id' });
    mockTransaction.mockReturnValue({
      create: mockTransactionCreate,
      commit: mockTransactionCommit,
    });
    mockTransactionCreate.mockReset();
    mockTransactionCommit.mockReset();
    mockTransactionCommit.mockResolvedValue({
      results: [{ document: { _id: 'doc-1' } }],
    });
    mockWriteClient.assets.upload.mockResolvedValue({ _id: 'image-1' });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('initializes read and write clients with expected configuration', async () => {
    const clientModule = await loadModule();
    new clientModule.SanityHTTPClient();

    expect(mockCreateClient).toHaveBeenCalledTimes(2);
    expect(mockCreateClient).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        projectId: REQUIRED_ENV.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: REQUIRED_ENV.NEXT_PUBLIC_SANITY_DATASET,
        useCdn: false,
      })
    );
    expect(mockCreateClient).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        token: REQUIRED_ENV.SANITY_API_TOKEN,
        useCdn: false,
      })
    );
  });

  it('throws a SanityAPIError when required environment variables are missing', async () => {
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const clientModule = await loadModule();

    expect(() => new clientModule.SanityHTTPClient()).toThrow(clientModule.SanityAPIError);
  });

  it('warns about missing optional environment variables', async () => {
    delete process.env.SANITY_API_TOKEN;

    await jest.isolateModulesAsync(async () => {
      jest.doMock('@/lib/logger');
      const mod = await import('../sanity-http-client');
      new mod.SanityHTTPClient();
      const logger = jest.mocked((jest.requireMock('@/lib/logger') as any).structuredLogger);
      expect(logger.warn).toHaveBeenCalledWith(
        'Missing optional environment variable: SANITY_API_TOKEN',
        {
          component: 'sanity-http',
        }
      );
    });
  });

  describe('query', () => {
    it('uses preview client when preview option is enabled', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      const previewFetch = jest.fn().mockResolvedValue(['preview']);
      mockReadClient.withConfig.mockReturnValue({ fetch: previewFetch });

      const result = await client.query('*', { id: 1 }, { preview: true });

      expect(mockReadClient.withConfig).toHaveBeenCalledWith({
        useCdn: false,
        perspective: 'previewDrafts',
        token: REQUIRED_ENV.SANITY_API_TOKEN,
      });
      expect(previewFetch).toHaveBeenCalledWith('*', { id: 1 });
      expect(result).toEqual(['preview']);
    });

    it('falls back to the base client when preview configuration is unavailable', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      const originalWithConfig = mockReadClient.withConfig;
      (mockReadClient as unknown as { withConfig?: typeof originalWithConfig }).withConfig =
        undefined;
      mockReadClient.fetch.mockResolvedValueOnce(['default']);

      const result = await client.query('*', undefined, { preview: true });

      expect(mockReadClient.fetch).toHaveBeenCalledWith('*', undefined);
      expect(result).toEqual(['default']);

      (mockReadClient as unknown as { withConfig?: typeof originalWithConfig }).withConfig =
        originalWithConfig;
    });

    it('throws SanityAPIError when the underlying fetch returns an error payload', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockReadClient.fetch.mockResolvedValue({ error: 'Nope', statusCode: 401 });

      await expect(client.query('*')).rejects.toThrow(clientModule.SanityAPIError);
    });

    it('throws SanityAPIError when the query resolves to undefined', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockReadClient.fetch.mockResolvedValue(undefined);

      await expect(client.query('*')).rejects.toThrow('Query failed: Query error');
    });
  });

  describe('testAuthentication', () => {
    it('returns false when no API token is present', async () => {
      delete process.env.SANITY_API_TOKEN;
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.create).not.toHaveBeenCalled();
    });

    it('returns true when a document can be created and cleaned up', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue({ _id: 'auth-1' });
      mockWriteClient.delete.mockResolvedValue({});

      await expect(client.testAuthentication()).resolves.toBe(true);
      expect(mockWriteClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'authTest',
          title: 'Authentication Test',
        })
      );
      expect(mockWriteClient.delete).toHaveBeenCalledWith('auth-1');
    });

    it('still resolves true when cleanup fails', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue({ _id: 'auth-cleanup' });
      mockWriteClient.delete.mockRejectedValue(new Error('cleanup failed'));

      await expect(client.testAuthentication()).resolves.toBe(true);
      expect(mockWriteClient.delete).toHaveBeenCalledWith('auth-cleanup');
    });

    it('returns false when write access is denied', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockRejectedValue(new Error('permission denied'));

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.delete).not.toHaveBeenCalled();
    });

    it('returns false when the created document is missing an id', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue({ _type: 'authTest' });

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.delete).not.toHaveBeenCalled();
    });

    it('returns false when the created document reports an error', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue({ error: 'denied' });

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.delete).not.toHaveBeenCalled();
    });

    it('returns false when the write client resolves without a document', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue(undefined as unknown as { _id: string });

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.delete).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('throws when no API token is configured', async () => {
      delete process.env.SANITY_API_TOKEN;
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();

      await expect(client.create({ _type: 'test' })).rejects.toThrow(
        'Cannot create document: No API token provided'
      );
    });

    it('returns created document and logs in debug mode', async () => {
      process.env.SANITY_HTTP_DEBUG = '1';

      await jest.isolateModulesAsync(async () => {
        jest.doMock('@/lib/logger');
        const mod = await import('../sanity-http-client');
        const client = new mod.SanityHTTPClient();
        const doc = { _id: 'doc-1', _type: 'test' };
        mockWriteClient.create.mockResolvedValue(doc);

        const result = await client.create({ _type: 'test' });

        expect(mockWriteClient.create).toHaveBeenCalledWith({ _type: 'test' });
        expect(result).toEqual(doc);
        const logger = jest.mocked((jest.requireMock('@/lib/logger') as any).structuredLogger);
        expect(logger.info).toHaveBeenCalledWith('Sanity document created', {
          component: 'sanity-http',
          id: 'doc-1',
        });
      });

      delete process.env.SANITY_HTTP_DEBUG;
    });

    it('logs an alternate message when a document is created without an id', async () => {
      process.env.SANITY_HTTP_DEBUG = '1';

      await jest.isolateModulesAsync(async () => {
        jest.doMock('@/lib/logger');
        const mod = await import('../sanity-http-client');
        const client = new mod.SanityHTTPClient();
        mockWriteClient.create.mockResolvedValue({ _type: 'test', title: 'no-id' });

        const result = await client.create({ _type: 'test' });

        expect(result).toEqual({ _type: 'test', title: 'no-id' });
        const logger = jest.mocked((jest.requireMock('@/lib/logger') as any).structuredLogger);
        expect(logger.info).toHaveBeenCalledWith('Sanity document created (no _id)', {
          component: 'sanity-http',
        });
      });

      delete process.env.SANITY_HTTP_DEBUG;
    });

    it('throws a SanityAPIError when the create result contains an error payload', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue({ error: 'broken', statusCode: 500 });

      await expect(client.create({ _type: 'test' })).rejects.toThrow('Create failed: broken');
    });

    it('throws a SanityAPIError when create resolves to undefined', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue(undefined);

      await expect(client.create({ _type: 'test' })).rejects.toThrow('Create failed: Create error');
    });

    it('throws when create resolves to a falsy value', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue(null as unknown as Record<string, unknown>);

      await expect(client.create({ _type: 'test' })).rejects.toThrow(
        'Create operation returned no result'
      );
    });

    it('wraps unexpected create errors', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.create.mockRejectedValue(new Error('explode'));

      await expect(client.create({ _type: 'test' })).rejects.toThrow('Create failed: explode');
    });
  });

  describe('update', () => {
    it('patches document and returns commit result', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockCommit.mockResolvedValue({ _id: 'doc-1', _type: 'test' });

      const result = await client.update('doc-1', { title: 'new' });

      expect(mockPatch).toHaveBeenCalledWith('doc-1');
      expect(mockSet).toHaveBeenCalledWith({ title: 'new' });
      expect(mockCommit).toHaveBeenCalled();
      expect(result).toEqual({ _id: 'doc-1', _type: 'test' });
    });

    it('logs debug information when SANITY_HTTP_DEBUG is enabled', async () => {
      process.env.SANITY_HTTP_DEBUG = '1';

      await jest.isolateModulesAsync(async () => {
        jest.doMock('@/lib/logger');
        const mod = await import('../sanity-http-client');
        const client = new mod.SanityHTTPClient();
        mockCommit.mockResolvedValue({ _id: 'doc-2', _type: 'test' });

        await client.update('doc-2', { title: 'debug' });

        const logger = jest.mocked((jest.requireMock('@/lib/logger') as any).structuredLogger);
        expect(logger.info).toHaveBeenCalledWith('Sanity document updated', {
          component: 'sanity-http',
          id: 'doc-2',
        });
      });

      delete process.env.SANITY_HTTP_DEBUG;
    });

    it('wraps unexpected errors into SanityAPIError', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockCommit.mockRejectedValue(new Error('commit broke'));

      await expect(client.update('doc-1', {})).rejects.toThrow(clientModule.SanityAPIError);
    });

    it('throws when no API token is configured', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      delete process.env.SANITY_API_TOKEN;

      await expect(client.update('doc-1', {})).rejects.toThrow(
        'Cannot update document: No API token provided'
      );
    });

    it('throws when commit is not a function', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockPatch.mockImplementationOnce(() => ({
        set: () => ({}) as { commit(): Promise<unknown> },
      }));

      await expect(client.update('doc-1', {})).rejects.toThrow(
        'Update failed: commit is not a function'
      );
    });

    it('throws when commit returns an error payload', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockCommit.mockResolvedValue({ error: 'nope', statusCode: 409 });

      await expect(client.update('doc-1', {})).rejects.toThrow('Update failed: nope');
    });

    it('throws when commit resolves to undefined', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockCommit.mockResolvedValue(undefined);

      await expect(client.update('doc-1', {})).rejects.toThrow('Update failed: Update error');
    });

    it('throws when commit resolves to a falsy value', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockCommit.mockResolvedValue(null as unknown as Record<string, unknown>);

      await expect(client.update('doc-1', {})).rejects.toThrow(
        'Update operation returned no result'
      );
    });
  });

  describe('delete', () => {
    it('delegates to write client delete method', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.delete.mockResolvedValue({ success: true });

      await client.delete('doc-1');

      expect(mockWriteClient.delete).toHaveBeenCalledWith('doc-1');
    });

    it('logs debug information when deleting documents', async () => {
      process.env.SANITY_HTTP_DEBUG = '1';

      await jest.isolateModulesAsync(async () => {
        jest.doMock('@/lib/logger');
        const mod = await import('../sanity-http-client');
        const client = new mod.SanityHTTPClient();
        mockWriteClient.delete.mockResolvedValue({ success: true } as any);

        await client.delete('doc-3');

        const logger = jest.mocked((jest.requireMock('@/lib/logger') as any).structuredLogger);
        expect(logger.info).toHaveBeenCalledWith('Sanity document deleted', {
          component: 'sanity-http',
          id: 'doc-3',
        });
      });

      delete process.env.SANITY_HTTP_DEBUG;
    });

    it('wraps write client errors', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.delete.mockRejectedValue(new Error('boom'));

      await expect(client.delete('doc-1')).rejects.toThrow(clientModule.SanityAPIError);
    });

    it('throws when no API token is configured', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      delete process.env.SANITY_API_TOKEN;

      await expect(client.delete('doc-1')).rejects.toThrow(
        'Cannot delete document: No API token provided'
      );
    });

    it('throws when delete returns an error payload', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.delete.mockResolvedValue({ error: 'nope', statusCode: 500 });

      await expect(client.delete('doc-1')).rejects.toThrow('Delete failed: nope');
    });

    it('throws when delete resolves to undefined', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.delete.mockResolvedValue(undefined);

      await expect(client.delete('doc-1')).rejects.toThrow('Delete failed: Delete error');
    });
  });

  describe('uploadAsset', () => {
    it('rejects non-image uploads', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();

      await expect(
        client.uploadAsset(Buffer.from('data'), { contentType: 'application/json' })
      ).rejects.toThrow(
        'Asset upload failed: Only image/* content types are supported by uploadAsset()'
      );
    });

    it('uploads image assets and returns sanity image object', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.assets.upload.mockResolvedValue({ _id: 'image-1' });

      const image = await client.uploadAsset(Buffer.from('file'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

      expect(mockWriteClient.assets.upload).toHaveBeenCalledWith('image', expect.any(Buffer), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        title: undefined,
        description: undefined,
      });
      expect(image).toEqual({
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-1' },
      });
    });

    it('throws when no API token is available', async () => {
      delete process.env.SANITY_API_TOKEN;
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Cannot upload asset: No API token provided');
    });

    it('throws when the client does not expose an upload helper', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      const originalAssets = mockWriteClient.assets;
      (mockWriteClient as unknown as { assets?: unknown }).assets = {};

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: this.writeClient.assets.upload is not a function');

      (mockWriteClient as unknown as { assets?: unknown }).assets = originalAssets;
    });

    it('wraps upload errors from the Sanity client', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.assets.upload.mockRejectedValue(new Error('network down'));

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: network down');
    });

    it('throws when upload returns an error payload', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.assets.upload.mockResolvedValue({ error: 'bad', statusCode: 400 });

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: bad');
    });

    it('throws when upload resolves to undefined', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.assets.upload.mockResolvedValue(undefined);

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: Upload error');
    });

    it('throws when upload resolves to a falsy value', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.assets.upload.mockResolvedValue(null as unknown as Record<string, unknown>);

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Upload asset operation returned no result');
    });

    it('throws when the asset id is invalid', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockWriteClient.assets.upload.mockResolvedValue({ _id: '   ' });

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: Invalid asset id');
    });
  });

  describe('createMany', () => {
    it('creates documents in a transaction and returns committed docs', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      const docs = [
        { _id: 'doc-1', _type: 'item' },
        { _id: 'doc-2', _type: 'item' },
      ];
      const txCreate = jest.fn();
      const txCommit = jest.fn().mockResolvedValue({
        results: [{ document: docs[0] }, { document: docs[1] }],
      });
      mockTransaction.mockReturnValue({ create: txCreate, commit: txCommit });

      const created = await client.createMany(docs);

      expect(txCreate).toHaveBeenCalledTimes(2);
      expect(txCommit).toHaveBeenCalledWith({ returnDocuments: true });
      expect(created).toEqual(docs);
    });

    it('supports transactions that return documents directly', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      const docs = [
        { _id: 'direct-1', _type: 'item' },
        { _id: 'direct-2', _type: 'item' },
      ];
      mockTransaction.mockReturnValue({
        create: jest.fn(),
        commit: jest.fn().mockResolvedValue(docs),
      });

      const created = await client.createMany(docs);

      expect(created).toEqual(docs);
    });

    it('wraps transaction errors into SanityAPIError', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      const txCommit = jest.fn().mockRejectedValue(new Error('tx failed'));
      mockTransaction.mockReturnValue({ create: jest.fn(), commit: txCommit });

      await expect(client.createMany([{ _id: 'doc-1', _type: 'item' }])).rejects.toThrow(
        clientModule.SanityAPIError
      );
    });

    it('throws when no API token is configured', async () => {
      delete process.env.SANITY_API_TOKEN;
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();

      await expect(client.createMany([])).rejects.toThrow(
        'Cannot create documents: No API token provided'
      );
    });

    it('throws when the transaction does not return an array', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockTransaction.mockReturnValue({
        create: jest.fn(),
        commit: jest.fn().mockResolvedValue({ error: 'no docs', statusCode: 500 }),
      });

      await expect(client.createMany([{ _id: '1', _type: 'item' }])).rejects.toThrow(
        'Batch create failed: no docs'
      );
    });

    it('throws when the transaction returns no documents', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockTransaction.mockReturnValue({
        create: jest.fn(),
        commit: jest.fn().mockResolvedValue({ results: [] }),
      });

      await expect(client.createMany([{ _id: '1', _type: 'item' }])).rejects.toThrow(
        'Batch create operation returned no documents'
      );
    });

    it('wraps unexpected transaction factory errors', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockTransaction.mockImplementationOnce(() => {
        throw new Error('transaction unavailable');
      });

      await expect(client.createMany([{ _id: '1', _type: 'item' }])).rejects.toThrow(
        'Batch create failed: transaction unavailable'
      );
    });
  });

  describe('healthCheck', () => {
    it('reports ok when read and write checks succeed', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockReadClient.fetch.mockResolvedValue({});
      mockWriteClient.create.mockResolvedValue({ _id: 'tmp', _type: 'authTest' });
      mockWriteClient.delete.mockResolvedValue({});

      const result = await client.healthCheck();

      expect(result.status).toBe('ok');
      expect(result.details).toMatchObject({
        projectId: REQUIRED_ENV.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: REQUIRED_ENV.NEXT_PUBLIC_SANITY_DATASET,
        writeAccess: true,
      });
    });

    it('returns error status when query throws', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockReadClient.fetch.mockRejectedValue(new Error('fetch failed'));

      const result = await client.healthCheck();

      expect(result.status).toBe('error');
      expect(result.details.error).toBe('Query failed: fetch failed');
    });

    it('returns error status when write authentication fails', async () => {
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockReadClient.fetch.mockResolvedValue({});
      jest.spyOn(client, 'testAuthentication').mockResolvedValue(false);

      const result = await client.healthCheck();

      expect(result.status).toBe('error');
      expect(result.details).toEqual({ error: 'Unknown error' });
    });

    it('reports read-only access details when no API token is configured', async () => {
      delete process.env.SANITY_API_TOKEN;
      const clientModule = await loadModule();
      const client = new clientModule.SanityHTTPClient();
      mockReadClient.fetch.mockResolvedValue({});

      const result = await client.healthCheck();

      expect(result.status).toBe('ok');
      expect(result.details).toMatchObject({
        writeAccess: false,
        hasToken: false,
      });
    });
  });

  it('throws when requesting write client without token', async () => {
    delete process.env.SANITY_API_TOKEN;
    const clientModule = await loadModule();
    const client = new clientModule.SanityHTTPClient();

    expect(() => client.getWriteClient()).toThrow('Cannot get write client: No API token provided');
  });

  it('returns the write client when a token is available', async () => {
    const clientModule = await loadModule();
    const client = new clientModule.SanityHTTPClient();

    expect(client.getWriteClient()).toBe(mockWriteClient);
  });

  describe('singleton accessors', () => {
    it('returns a singleton instance that backs the proxy accessors', async () => {
      const mockModule = await import('../sanity/client');
      const clientModule = await loadModule();

      const first = clientModule.getSanityHTTPClient();
      const second = clientModule.getSanityHTTPClient();

      expect(second).toBe(first);
      expect(mockModule.createClient).toHaveBeenCalledTimes(2);

      mockReadClient.fetch.mockResolvedValue(['proxied']);
      await expect(clientModule.sanityHTTPClient.query('*')).resolves.toEqual(['proxied']);
      expect(mockReadClient.fetch).toHaveBeenCalledWith('*', undefined);
      expect(mockModule.createClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('getClient', () => {
    it('returns the read client by default', async () => {
      const clientModule = await loadModule();
      const client = clientModule.getClient();

      expect(client).toBe(mockReadClient);
    });

    it('creates a preview client when requested', async () => {
      const mockModule = await import('../sanity/client');
      const clientModule = await loadModule();
      new clientModule.SanityHTTPClient();
      const previewClient = { kind: 'preview' } as unknown as typeof mockReadClient;
      (mockModule.createClient as jest.Mock).mockReturnValueOnce(previewClient);

      const client = clientModule.getClient(true);

      expect(client).toBe(previewClient);
      expect(mockModule.createClient).toHaveBeenLastCalledWith(
        expect.objectContaining({
          useCdn: false,
          perspective: 'previewDrafts',
          dataset: REQUIRED_ENV.NEXT_PUBLIC_SANITY_DATASET,
        })
      );
    });
  });
});
