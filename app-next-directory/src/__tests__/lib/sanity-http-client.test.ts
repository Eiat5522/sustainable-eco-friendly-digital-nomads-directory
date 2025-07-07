import { SanityHTTPClient, SanityAPIError } from '../../lib/sanity-http-client';
import { createClient } from '../../lib/sanity/client';
import { Buffer } from 'buffer';

// Mock @sanity/client
jest.mock('../../lib/sanity/client', () => ({
  createClient: jest.fn(() => {
    const hasToken = !!process.env.SANITY_API_TOKEN;
    const mockCommit = jest.fn();
    const mockSet = jest.fn(() => ({
      commit: mockCommit,
    }));
    const mockPatch = jest.fn(() => ({
      set: mockSet,
    }));

    const mockClient = {
      fetch: jest.fn(),
      create: jest.fn(() => Promise.resolve({ _id: 'mockCreatedId' })),
      delete: jest.fn(() => Promise.resolve({ _id: 'mockDeletedId' })),
      patch: jest.fn(() => ({
        set: jest.fn().mockReturnThis(),
        commit: jest.fn(() => Promise.resolve({ _id: 'mockUpdatedId' })),
      })),
      assets: {},
      transaction: jest.fn(() => ({
        create: jest.fn().mockReturnThis(),
        commit: jest.fn(() => Promise.resolve([{ _id: 'mockDoc1' }, { _id: 'mockDoc2' }])),
      })),
    };
    return mockClient;
  }),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('SanityHTTPClient', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'testProjectId',
      NEXT_PUBLIC_SANITY_DATASET: 'testDataset',
      SANITY_API_TOKEN: 'testApiToken',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should initialize with correct config and clients', () => {
    const client = new SanityHTTPClient();
    expect(mockCreateClient).toHaveBeenCalledTimes(2);
    expect(mockCreateClient).toHaveBeenCalledWith({
      projectId: 'testProjectId',
      dataset: 'testDataset',
      apiVersion: '2025-05-24',
      useCdn: false, // NODE_ENV is not production in test env
    });
    expect(mockCreateClient).toHaveBeenCalledWith({
      projectId: 'testProjectId',
      dataset: 'testDataset',
      apiVersion: '2025-05-24',
      token: 'testApiToken',
      useCdn: false,
    });
  });

  it('should throw SanityAPIError if required environment variables are missing', () => {
    if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      delete (process.env as any).NEXT_PUBLIC_SANITY_PROJECT_ID;
    }
    expect(() => new SanityHTTPClient()).toThrow(SanityAPIError);
    expect(() => new SanityHTTPClient()).toThrow('Missing required environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID');
  });

  describe('testAuthentication', () => {
    it('should return true if authentication is successful', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;
      mockWriteClient.create.mockResolvedValueOnce({ _id: 'testId' });
      mockWriteClient.delete.mockResolvedValueOnce({}); // Ensure delete also resolves

      const result = await client.testAuthentication();
      expect(result).toBe(true);
      expect(mockWriteClient.create).toHaveBeenCalledWith(
        expect.objectContaining({ _type: 'authTest' })
      );
      expect(mockWriteClient.delete).toHaveBeenCalledWith(expect.any(String));
    });

    it('should return false if no API token is provided', async () => {
      if (process.env.SANITY_API_TOKEN) {
        delete (process.env as any).SANITY_API_TOKEN;
      }
      const client = new SanityHTTPClient();
      const result = await client.testAuthentication();
      expect(result).toBe(false);
    });

    it('should return false if authentication fails', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;
      mockWriteClient.create.mockRejectedValueOnce(new Error('Auth failed'));

      const result = await client.testAuthentication();
      expect(result).toBe(false);
    });
  });

  describe('query', () => {
    it('should fetch data using the read client', async () => {
      const client = new SanityHTTPClient();
      const mockReadClient = mockCreateClient.mock.results[0].value;
      mockReadClient.fetch.mockResolvedValueOnce(['data']);

      const result = await client.query('*[_type == "post"]');
      expect(result).toEqual(['data']);
      expect(mockReadClient.fetch).toHaveBeenCalledWith('*[_type == "post"]', undefined);
    });

    it('should fetch data using the preview client if options.preview is true', async () => {
      const client = new SanityHTTPClient();
      const mockReadClient = mockCreateClient.mock.results[0].value;
      mockReadClient.fetch.mockResolvedValueOnce(['previewData']);

      const result = await client.query('*[_type == "post"]', {}, { preview: true });
      expect(result).toEqual(['previewData']);
      expect(mockReadClient.fetch).toHaveBeenCalledWith('*[_type == "post"]', {});
    });

    it('should throw SanityAPIError if query fails', async () => {
      const client = new SanityHTTPClient();
      const mockReadClient = mockCreateClient.mock.results[0].value;
      mockReadClient.fetch.mockRejectedValueOnce(new Error('Query error'));

      await expect(client.query('invalid query')).rejects.toThrow(SanityAPIError);
      await expect(client.query('invalid query')).rejects.toThrow('Query failed: Query error');
    });
  });

  describe('create', () => {
    it('should create a document', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;

      const doc = { _type: 'test', title: 'New Document' };
      const result = await client.create(doc);
      expect(result).toEqual({ _id: 'mockCreatedId' });
      expect(mockWriteClient.create).toHaveBeenCalledWith(doc);
    });

    it('should throw SanityAPIError if no API token is provided', async () => {
      if (process.env.SANITY_API_TOKEN) {
        delete (process.env as any).SANITY_API_TOKEN;
      }
      const client = new SanityHTTPClient();
      const doc = { _type: 'test', title: 'New Document' };
      await expect(client.create(doc)).rejects.toThrow(SanityAPIError);
      await expect(client.create(doc)).rejects.toThrow('Cannot create document: No API token provided');
    });

    it('should throw SanityAPIError if create fails', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;
      mockWriteClient.create.mockRejectedValueOnce(new Error('Create error'));

      const doc = { _type: 'test', title: 'New Document' };
      await expect(client.create(doc)).rejects.toThrow(SanityAPIError);
      await expect(client.create(doc)).rejects.toThrow('Create failed: Create error');
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;

      const id = 'doc123';
      const patches = { title: 'Updated Title' };
      const result = await client.update(id, patches);
      expect(result).toEqual({ _id: 'mockUpdatedId' });
      expect(mockWriteClient.patch).toHaveBeenCalledWith(id);
      expect(mockWriteClient.patch().set).toHaveBeenCalledWith(patches);
      expect(mockWriteClient.patch().set().commit).toHaveBeenCalled();
    });

    it('should throw SanityAPIError if no API token is provided', async () => {
      if (process.env.SANITY_API_TOKEN) {
        delete (process.env as any).SANITY_API_TOKEN;
      }
      const client = new SanityHTTPClient();
      await expect(client.update('doc123', {})).rejects.toThrow(SanityAPIError);
      await expect(client.update('doc123', {})).rejects.toThrow('Cannot update document: No API token provided');
    });

    it('should throw SanityAPIError if update fails', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;
      mockWriteClient.patch().set().commit.mockRejectedValueOnce(new Error('Update error'));

      await expect(client.update('doc123', {})).rejects.toThrow(SanityAPIError);
      await expect(client.update('doc123', {})).rejects.toThrow('Update failed: Update error');
    });
  });

  describe('delete', () => {
    it('should delete a document', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;

      const id = 'doc123';
      const result = await client.delete(id);
      expect(result).toEqual({ _id: 'mockDeletedId' });
      expect(mockWriteClient.delete).toHaveBeenCalledWith(expect.any(String));
    });

    it('should throw SanityAPIError if no API token is provided', async () => {
      if (process.env.SANITY_API_TOKEN) {
        delete (process.env as any).SANITY_API_TOKEN;
      }
      const client = new SanityHTTPClient();
      await expect(client.delete('doc123')).rejects.toThrow(SanityAPIError);
      await expect(client.delete('doc123')).rejects.toThrow('Cannot delete document: No API token provided');
    });

    it('should throw SanityAPIError if delete fails', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;
      mockWriteClient.delete.mockRejectedValueOnce(new Error('Delete error'));

      await expect(client.delete('doc123')).rejects.toThrow(SanityAPIError);
      await expect(client.delete('doc123')).rejects.toThrow('Delete failed: Delete error');
    });
  });

  describe('uploadAsset', () => {
    it('should upload an asset', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;

      const file = Buffer.from('test');
      const options = { filename: 'test.jpg' };
      const result = await client.uploadAsset(file, options);
      expect(result).toEqual({ _id: 'mockAssetId' });
      expect(mockWriteClient.assets.upload).toHaveBeenCalledWith('image', file, options);
    });

    it('should throw SanityAPIError if no API token is provided', async () => {
      if (process.env.SANITY_API_TOKEN) {
        delete (process.env as any).SANITY_API_TOKEN;
      }
      const client = new SanityHTTPClient();
      const file = Buffer.from('test');
      await expect(client.uploadAsset(file)).rejects.toThrow(SanityAPIError);
      await expect(client.uploadAsset(file)).rejects.toThrow('Cannot upload asset: No API token provided');
    });

    it('should throw SanityAPIError if upload fails', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;
      mockWriteClient.assets.upload.mockRejectedValueOnce(new Error('Upload error'));

      const file = Buffer.from('test');
      await expect(client.uploadAsset(file)).rejects.toThrow(SanityAPIError);
      await expect(client.uploadAsset(file)).rejects.toThrow('Asset upload failed: Upload error');
    });
  });

  describe('createMany', () => {
    it('should create multiple documents in a transaction', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;
      const mockTransaction = {
        create: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValueOnce(['doc1', 'doc2']),
      };
      mockWriteClient.transaction.mockReturnValueOnce(mockTransaction);

      const docs = [{ _type: 'test', title: 'Doc 1' }, { _type: 'test', title: 'Doc 2' }];
      const result = await client.createMany(docs);
      expect(result).toEqual([{ _id: 'mockDoc1' }, { _id: 'mockDoc2' }]);
      expect(mockWriteClient.transaction).toHaveBeenCalled();
      expect(mockTransaction.create).toHaveBeenCalledTimes(2);
      expect(mockTransaction.create).toHaveBeenCalledWith(docs[0]);
      expect(mockTransaction.create).toHaveBeenCalledWith(docs[1]);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw SanityAPIError if no API token is provided', async () => {
      if (process.env.SANITY_API_TOKEN) {
        delete (process.env as any).SANITY_API_TOKEN;
      }
      const client = new SanityHTTPClient();
      const docs = [{ _type: 'test', title: 'Doc 1' }];
      await expect(client.createMany(docs)).rejects.toThrow(SanityAPIError);
      await expect(client.createMany(docs)).rejects.toThrow('Cannot create documents: No API token provided');
    });

    it('should throw SanityAPIError if batch create fails', async () => {
      const client = new SanityHTTPClient();
      const mockWriteClient = mockCreateClient.mock.results[1].value;
      const mockTransaction = {
        create: jest.fn().mockReturnThis(),
        commit: jest.fn().mockRejectedValueOnce(new Error('Batch create error')),
      };
      mockWriteClient.transaction.mockReturnValueOnce(mockTransaction);

      const docs = [{ _type: 'test', title: 'Doc 1' }];
      await expect(client.createMany(docs)).rejects.toThrow(SanityAPIError);
      await expect(client.createMany(docs)).rejects.toThrow('Batch create failed: Batch create error');
    });
  });

  describe('healthCheck', () => {
    it('should return ok status with write access if token is provided', async () => {
      const client = new SanityHTTPClient();
      const mockReadClient = mockCreateClient.mock.results[0].value;
      const mockWriteClient = mockCreateClient.mock.results[1].value;

      mockReadClient.fetch.mockResolvedValueOnce({});
      mockWriteClient.create.mockResolvedValueOnce({ _id: 'testId' });
      mockWriteClient.delete.mockResolvedValueOnce({}); // Mock delete for cleanup

      const result = await client.healthCheck();
      expect(result.status).toBe('ok');
      expect(result.details.readAccess).toBe(true);
      expect(result.details.writeAccess).toBe(true);
      expect(result.details.hasToken).toBe(true);
    });

    it('should return ok status without write access if no token is provided', async () => {
      if (process.env.SANITY_API_TOKEN) {
        delete (process.env as any).SANITY_API_TOKEN;
      }
      const client = new SanityHTTPClient();
      const mockReadClient = mockCreateClient.mock.results[0].value;
      mockReadClient.fetch.mockResolvedValueOnce({});

      const result = await client.healthCheck();
      expect(result.status).toBe('ok');
      expect(result.details.readAccess).toBe(true);
      expect(result.details.writeAccess).toBe(false);
      expect(result.details.hasToken).toBe(false);
    });

    it('should return error status if read access fails', async () => {
      const client = new SanityHTTPClient();
      const mockReadClient = mockCreateClient.mock.results[0].value;
      mockReadClient.fetch.mockRejectedValueOnce(new Error('Read error'));

      const result = await client.healthCheck();
      expect(result.status).toBe('error');
      expect(result.details.error).toBe('Query failed: Read error');
    });

    it('should return error status if write access fails', async () => {
      const client = new SanityHTTPClient();
      const mockReadClient = mockCreateClient.mock.results[0].value;
      mockReadClient.fetch.mockResolvedValueOnce({});
      // Mock testAuthentication to return false directly
      jest.spyOn(client, 'testAuthentication').mockResolvedValueOnce(false);

      const result = await client.healthCheck();
      expect(result.status).toBe('error');
      expect(result.details.error).toBe('Unknown error'); // This is the generic error message when testAuthentication returns false
    });
  });

  describe('getReadClient', () => {
    it('should return the read client', () => {
      const client = new SanityHTTPClient();
      const readClient = client.getReadClient();
      expect(readClient).toBe(mockCreateClient.mock.results[0].value);
    });
  });

  describe('getWriteClient', () => {
    it('should return the write client if token is provided', () => {
      const client = new SanityHTTPClient();
      const writeClient = client.getWriteClient();
      expect(writeClient).toBe(mockCreateClient.mock.results[1].value);
    });

    it('should throw SanityAPIError if no API token is provided', () => {
      delete (process.env as any).SANITY_API_TOKEN;
      const client = new SanityHTTPClient();
      expect(() => client.getWriteClient()).toThrow(SanityAPIError);
      expect(() => client.getWriteClient()).toThrow('Cannot get write client: No API token provided');
    });
  });
});
