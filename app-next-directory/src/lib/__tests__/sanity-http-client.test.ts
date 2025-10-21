import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const REQUIRED_ENV = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project-id',
  NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
  SANITY_API_TOKEN: 'test-api-token',
};

const mockCommit = jest.fn();
const mockSet = jest.fn(() => ({ commit: mockCommit }));
const mockPatch = jest.fn(() => ({ set: mockSet }));
const mockTransactionCreate = jest.fn();
const mockTransactionCommit = jest.fn();
const mockTransaction = jest.fn(() => ({
  create: mockTransactionCreate,
  commit: mockTransactionCommit,
}));
const mockReadClient = {
  fetch: jest.fn(),
  withConfig: jest.fn(),
};
const mockWriteClient = {
  create: jest.fn(),
  delete: jest.fn(),
  assets: { upload: jest.fn() },
  patch: mockPatch,
  transaction: mockTransaction,
};

jest.mock('../sanity/client', () => {
  const createClient = jest.fn((config: { token?: string }) =>
    createClient.mock.calls.length === 0 || !config.token
      ? mockReadClient
      : mockWriteClient
  );

  return { createClient };
});

describe('SanityHTTPClient', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, ...REQUIRED_ENV };

    jest.clearAllMocks();
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

  const loadModule = async () => {
    let module: typeof import('../sanity-http-client');
    await jest.isolateModulesAsync(async () => {
      module = await import('../sanity-http-client');
    });
    return module!;
  };

  it('initializes read and write clients with expected configuration', async () => {
    const mockModule = await import('../sanity/client');
    const module = await loadModule();

    new module.SanityHTTPClient();

    expect(mockModule.createClient).toHaveBeenCalledTimes(2);
    expect(mockModule.createClient).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        projectId: REQUIRED_ENV.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: REQUIRED_ENV.NEXT_PUBLIC_SANITY_DATASET,
        useCdn: false,
      })
    );
    expect(mockModule.createClient).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        token: REQUIRED_ENV.SANITY_API_TOKEN,
        useCdn: false,
      })
    );
  });

  it('throws a SanityAPIError when required environment variables are missing', async () => {
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const module = await loadModule();

    expect(() => new module.SanityHTTPClient()).toThrow(module.SanityAPIError);
  });

  it('warns about missing optional environment variables', async () => {
    delete process.env.SANITY_API_TOKEN;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const module = await loadModule();

    new module.SanityHTTPClient();

    expect(warnSpy).toHaveBeenCalledWith(
      'Warning: Missing optional environment variable: SANITY_API_TOKEN'
    );
    warnSpy.mockRestore();
  });

  describe('query', () => {
    it('uses preview client when preview option is enabled', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
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
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      const originalWithConfig = mockReadClient.withConfig;
      (mockReadClient as unknown as { withConfig?: typeof originalWithConfig }).withConfig = undefined;
      mockReadClient.fetch.mockResolvedValueOnce(['default']);

      const result = await client.query('*', undefined, { preview: true });

      expect(mockReadClient.fetch).toHaveBeenCalledWith('*', undefined);
      expect(result).toEqual(['default']);

      (mockReadClient as unknown as { withConfig?: typeof originalWithConfig }).withConfig = originalWithConfig;
    });

    it('throws SanityAPIError when the underlying fetch returns an error payload', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockReadClient.fetch.mockResolvedValue({ error: 'Nope', statusCode: 401 });

      await expect(client.query('*')).rejects.toThrow(module.SanityAPIError);
    });

    it('throws SanityAPIError when the query resolves to undefined', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockReadClient.fetch.mockResolvedValue(undefined);

      await expect(client.query('*')).rejects.toThrow('Query failed: Query error');
    });
  });

  describe('testAuthentication', () => {
    it('returns false when no API token is present', async () => {
      delete process.env.SANITY_API_TOKEN;
      const module = await loadModule();
      const client = new module.SanityHTTPClient();

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.create).not.toHaveBeenCalled();
    });

    it('returns true when a document can be created and cleaned up', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
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
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue({ _id: 'auth-cleanup' });
      mockWriteClient.delete.mockRejectedValue(new Error('cleanup failed'));

      await expect(client.testAuthentication()).resolves.toBe(true);
      expect(mockWriteClient.delete).toHaveBeenCalledWith('auth-cleanup');
    });

    it('returns false when write access is denied', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.create.mockRejectedValue(new Error('permission denied'));

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.delete).not.toHaveBeenCalled();
    });

    it('returns false when the created document is missing an id', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue({ _type: 'authTest' });

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.delete).not.toHaveBeenCalled();
    });

    it('returns false when the created document reports an error', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue({ error: 'denied' });

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.delete).not.toHaveBeenCalled();
    });

    it('returns false when the write client resolves without a document', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue(undefined as unknown as { _id: string });

      await expect(client.testAuthentication()).resolves.toBe(false);
      expect(mockWriteClient.delete).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('throws when no API token is configured', async () => {
      delete process.env.SANITY_API_TOKEN;
      const module = await loadModule();
      const client = new module.SanityHTTPClient();

      await expect(client.create({ _type: 'test' })).rejects.toThrow(
        'Cannot create document: No API token provided'
      );
    });

    it('returns created document and logs in debug mode', async () => {
      process.env.SANITY_HTTP_DEBUG = '1';
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      const doc = { _id: 'doc-1', _type: 'test' };
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      mockWriteClient.create.mockResolvedValue(doc);

      const result = await client.create({ _type: 'test' });

      expect(mockWriteClient.create).toHaveBeenCalledWith({ _type: 'test' });
      expect(result).toEqual(doc);
      expect(logSpy).toHaveBeenCalledWith('✅ Created document: doc-1');
      logSpy.mockRestore();
      delete process.env.SANITY_HTTP_DEBUG;
    });

    it('logs an alternate message when a document is created without an id', async () => {
      process.env.SANITY_HTTP_DEBUG = '1';
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      mockWriteClient.create.mockResolvedValue({ _type: 'test', title: 'no-id' });

      const result = await client.create({ _type: 'test' });

      expect(result).toEqual({ _type: 'test', title: 'no-id' });
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Created document (no _id)')
      );
      logSpy.mockRestore();
      delete process.env.SANITY_HTTP_DEBUG;
    });

    it('throws a SanityAPIError when the create result contains an error payload', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue({ error: 'broken', statusCode: 500 });

      await expect(client.create({ _type: 'test' })).rejects.toThrow(
        'Create failed: broken'
      );
    });

    it('throws a SanityAPIError when create resolves to undefined', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue(undefined);

      await expect(client.create({ _type: 'test' })).rejects.toThrow(
        'Create failed: Create error'
      );
    });

    it('throws when create resolves to a falsy value', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.create.mockResolvedValue(null as unknown as Record<string, unknown>);

      await expect(client.create({ _type: 'test' })).rejects.toThrow(
        'Create operation returned no result'
      );
    });

    it('wraps unexpected create errors', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.create.mockRejectedValue(new Error('explode'));

      await expect(client.create({ _type: 'test' })).rejects.toThrow(
        'Create failed: explode'
      );
    });
  });

  describe('update', () => {
    it('patches document and returns commit result', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockCommit.mockResolvedValue({ _id: 'doc-1', _type: 'test' });

      const result = await client.update('doc-1', { title: 'new' });

      expect(mockPatch).toHaveBeenCalledWith('doc-1');
      expect(mockSet).toHaveBeenCalledWith({ title: 'new' });
      expect(mockCommit).toHaveBeenCalled();
      expect(result).toEqual({ _id: 'doc-1', _type: 'test' });
    });

    it('logs debug information when SANITY_HTTP_DEBUG is enabled', async () => {
      process.env.SANITY_HTTP_DEBUG = '1';
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      mockCommit.mockResolvedValue({ _id: 'doc-2', _type: 'test' });

      await client.update('doc-2', { title: 'debug' });

      expect(logSpy).toHaveBeenCalledWith('✅ Updated document: doc-2');
      logSpy.mockRestore();
      delete process.env.SANITY_HTTP_DEBUG;
    });

    it('wraps unexpected errors into SanityAPIError', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockCommit.mockRejectedValue(new Error('commit broke'));

      await expect(client.update('doc-1', {})).rejects.toThrow(module.SanityAPIError);
    });

    it('throws when no API token is configured', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      delete process.env.SANITY_API_TOKEN;

      await expect(client.update('doc-1', {})).rejects.toThrow(
        'Cannot update document: No API token provided'
      );
    });

    it('throws when commit is not a function', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockPatch.mockImplementationOnce(() => ({
        set: () => ({} as { commit(): Promise<unknown> }),
      }));

      await expect(client.update('doc-1', {})).rejects.toThrow(
        'Update failed: commit is not a function'
      );
    });

    it('throws when commit returns an error payload', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockCommit.mockResolvedValue({ error: 'nope', statusCode: 409 });

      await expect(client.update('doc-1', {})).rejects.toThrow(
        'Update failed: nope'
      );
    });

    it('throws when commit resolves to undefined', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockCommit.mockResolvedValue(undefined);

      await expect(client.update('doc-1', {})).rejects.toThrow(
        'Update failed: Update error'
      );
    });

    it('throws when commit resolves to a falsy value', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockCommit.mockResolvedValue(null as unknown as Record<string, unknown>);

      await expect(client.update('doc-1', {})).rejects.toThrow(
        'Update operation returned no result'
      );
    });
  });

  describe('delete', () => {
    it('delegates to write client delete method', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.delete.mockResolvedValue({ success: true });

      await client.delete('doc-1');

      expect(mockWriteClient.delete).toHaveBeenCalledWith('doc-1');
    });

    it('logs debug information when deleting documents', async () => {
      process.env.SANITY_HTTP_DEBUG = '1';
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      mockWriteClient.delete.mockResolvedValue({ success: true });

      await client.delete('doc-3');

      expect(logSpy).toHaveBeenCalledWith('✅ Deleted document: doc-3');
      logSpy.mockRestore();
      delete process.env.SANITY_HTTP_DEBUG;
    });

    it('wraps write client errors', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.delete.mockRejectedValue(new Error('boom'));

      await expect(client.delete('doc-1')).rejects.toThrow(module.SanityAPIError);
    });

    it('throws when no API token is configured', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      delete process.env.SANITY_API_TOKEN;

      await expect(client.delete('doc-1')).rejects.toThrow(
        'Cannot delete document: No API token provided'
      );
    });

    it('throws when delete returns an error payload', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.delete.mockResolvedValue({ error: 'nope', statusCode: 500 });

      await expect(client.delete('doc-1')).rejects.toThrow('Delete failed: nope');
    });

    it('throws when delete resolves to undefined', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.delete.mockResolvedValue(undefined);

      await expect(client.delete('doc-1')).rejects.toThrow(
        'Delete failed: Delete error'
      );
    });
  });

  describe('uploadAsset', () => {
    it('rejects non-image uploads', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();

      await expect(
        client.uploadAsset(Buffer.from('data'), { contentType: 'application/json' })
      ).rejects.toThrow('Asset upload failed: Only image/* content types are supported by uploadAsset()');
    });

    it('uploads image assets and returns sanity image object', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
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
      const module = await loadModule();
      const client = new module.SanityHTTPClient();

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Cannot upload asset: No API token provided');
    });

    it('throws when the client does not expose an upload helper', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      const originalAssets = mockWriteClient.assets;
      (mockWriteClient as unknown as { assets?: unknown }).assets = {};

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: this.writeClient.assets.upload is not a function');

      (mockWriteClient as unknown as { assets?: unknown }).assets = originalAssets;
    });

    it('wraps upload errors from the Sanity client', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.assets.upload.mockRejectedValue(new Error('network down'));

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: network down');
    });

    it('throws when upload returns an error payload', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.assets.upload.mockResolvedValue({ error: 'bad', statusCode: 400 });

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: bad');
    });

    it('throws when upload resolves to undefined', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.assets.upload.mockResolvedValue(undefined);

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: Upload error');
    });

    it('throws when upload resolves to a falsy value', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.assets.upload.mockResolvedValue(null as unknown as Record<string, unknown>);

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Upload asset operation returned no result');
    });

    it('throws when the asset id is invalid', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockWriteClient.assets.upload.mockResolvedValue({ _id: '   ' });

      await expect(
        client.uploadAsset(Buffer.from('file'), { contentType: 'image/png' })
      ).rejects.toThrow('Asset upload failed: Invalid asset id');
    });
  });

  describe('createMany', () => {
    it('creates documents in a transaction and returns committed docs', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      const docs = [
        { _id: 'doc-1', _type: 'item' },
        { _id: 'doc-2', _type: 'item' },
      ];
      const txCreate = jest.fn();
      const txCommit = jest.fn().mockResolvedValue({
        results: [
          { document: docs[0] },
          { document: docs[1] },
        ],
      });
      mockTransaction.mockReturnValue({ create: txCreate, commit: txCommit });

      const created = await client.createMany(docs);

      expect(txCreate).toHaveBeenCalledTimes(2);
      expect(txCommit).toHaveBeenCalledWith({ returnDocuments: true });
      expect(created).toEqual(docs);
    });

    it('supports transactions that return documents directly', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
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
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      const txCommit = jest.fn().mockRejectedValue(new Error('tx failed'));
      mockTransaction.mockReturnValue({ create: jest.fn(), commit: txCommit });

      await expect(client.createMany([{ _id: 'doc-1', _type: 'item' }])).rejects.toThrow(
        module.SanityAPIError
      );
    });

    it('throws when no API token is configured', async () => {
      delete process.env.SANITY_API_TOKEN;
      const module = await loadModule();
      const client = new module.SanityHTTPClient();

      await expect(client.createMany([])).rejects.toThrow(
        'Cannot create documents: No API token provided'
      );
    });

    it('throws when the transaction does not return an array', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockTransaction.mockReturnValue({
        create: jest.fn(),
        commit: jest.fn().mockResolvedValue({ error: 'no docs', statusCode: 500 }),
      });

      await expect(client.createMany([{ _id: '1', _type: 'item' }])).rejects.toThrow(
        'Batch create failed: no docs'
      );
    });

    it('throws when the transaction returns no documents', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockTransaction.mockReturnValue({
        create: jest.fn(),
        commit: jest.fn().mockResolvedValue({ results: [] }),
      });

      await expect(client.createMany([{ _id: '1', _type: 'item' }])).rejects.toThrow(
        'Batch create operation returned no documents'
      );
    });

    it('wraps unexpected transaction factory errors', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
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
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
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
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockReadClient.fetch.mockRejectedValue(new Error('fetch failed'));

      const result = await client.healthCheck();

      expect(result.status).toBe('error');
      expect(result.details.error).toBe('Query failed: fetch failed');
    });

    it('returns error status when write authentication fails', async () => {
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
      mockReadClient.fetch.mockResolvedValue({});
      jest.spyOn(client, 'testAuthentication').mockResolvedValue(false);

      const result = await client.healthCheck();

      expect(result.status).toBe('error');
      expect(result.details).toEqual({ error: 'Unknown error' });
    });

    it('reports read-only access details when no API token is configured', async () => {
      delete process.env.SANITY_API_TOKEN;
      const module = await loadModule();
      const client = new module.SanityHTTPClient();
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
    const module = await loadModule();
    const client = new module.SanityHTTPClient();

    expect(() => client.getWriteClient()).toThrow('Cannot get write client: No API token provided');
  });

  it('returns the write client when a token is available', async () => {
    const module = await loadModule();
    const client = new module.SanityHTTPClient();

    expect(client.getWriteClient()).toBe(mockWriteClient);
  });

  describe('singleton accessors', () => {
    it('returns a singleton instance that backs the proxy accessors', async () => {
      const mockModule = await import('../sanity/client');
      const module = await loadModule();

      const first = module.getSanityHTTPClient();
      const second = module.getSanityHTTPClient();

      expect(second).toBe(first);
      expect(mockModule.createClient).toHaveBeenCalledTimes(2);

      mockReadClient.fetch.mockResolvedValue(['proxied']);
      await expect(module.sanityHTTPClient.query('*')).resolves.toEqual(['proxied']);
      expect(mockReadClient.fetch).toHaveBeenCalledWith('*', undefined);
      expect(mockModule.createClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('getClient', () => {
    it('returns the read client by default', async () => {
      const module = await loadModule();
      const client = module.getClient();

      expect(client).toBe(mockReadClient);
    });

    it('creates a preview client when requested', async () => {
      const mockModule = await import('../sanity/client');
      const module = await loadModule();
      new module.SanityHTTPClient();
      const previewClient = { kind: 'preview' } as unknown as typeof mockReadClient;
      (mockModule.createClient as jest.Mock).mockReturnValueOnce(previewClient);

      const client = module.getClient(true);

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
