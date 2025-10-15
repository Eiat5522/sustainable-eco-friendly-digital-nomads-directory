import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const createMock = jest.fn();
const updateMock = jest.fn();
const deleteMock = jest.fn();
const uploadBatchMock = jest.fn();

jest.mock('../sanity-http-client', () => ({
  sanityHTTPClient: {
    create: createMock,
    update: updateMock,
    delete: deleteMock,
  },
}));

jest.mock('../sanity-image-uploader', () => ({
  imageUploader: {
    uploadBatch: uploadBatchMock,
  },
}));

describe('SanityBatchProcessor', () => {
  const ORIGINAL_ENV = { ...process.env };

  const validListing = {
    name: 'Eco Stay',
    type: 'accommodation',
    city: 'Lisbon',
    country: 'Portugal',
    description: '  A lovely eco stay  ',
    website: 'https://example.com',
  } as const;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    uploadBatchMock.mockReset();
  });

  it('supports validation only runs with success and failure tallies', async () => {
    const { batchProcessor } = await import('../sanity-batch-processor');

    const result = await batchProcessor.createListingsBatch(
      [
        validListing,
        { ...validListing, name: '' },
      ],
      { validateOnly: true },
    );

    expect(result.failureCount).toBe(1);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toContain('Name is required');
    expect(result.summary).toContain('Validation complete');
  });

  it('creates listings, uploads images, and records failures', async () => {
    const { batchProcessor } = await import('../sanity-batch-processor');

    const file = new File(['img'], 'eco.jpg', { type: 'image/jpeg' });

    uploadBatchMock.mockResolvedValue({
      successful: [
        {
          asset: { _id: 'image-1', _type: 'sanity.imageAsset' },
        },
      ],
      failed: [],
      total: 1,
      successCount: 1,
      failureCount: 0,
    });

    createMock.mockImplementation(async (doc: any) => {
      if (doc.name === 'Bad Listing') {
        throw new Error('create failed');
      }
      return { ...doc, _id: 'listing-123' };
    });

    const listings = [
      { ...validListing, images: [file] },
      { ...validListing, name: 'Bad Listing', images: [] },
    ];

    const progress = jest.fn();

    const result = await batchProcessor.createListingsBatch(listings, { onProgress: progress });

    expect(createMock).toHaveBeenCalledTimes(4);
    expect(uploadBatchMock).toHaveBeenCalledWith(listings[0].images, expect.objectContaining({ concurrency: 2 }));
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(progress).toHaveBeenCalled();
  });

  it('updates listings in batches', async () => {
    const { batchProcessor } = await import('../sanity-batch-processor');
    updateMock.mockResolvedValue({ _id: 'listing-1' });

    const result = await batchProcessor.updateListingsBatch([
      { id: 'listing-1', data: { name: 'Updated' } },
    ]);

    expect(updateMock).toHaveBeenCalledWith('listing-1', expect.objectContaining({ name: 'Updated' }));
    expect(result.successCount).toBe(1);
  });

  it('deletes listings in batch mode', async () => {
    const { batchProcessor } = await import('../sanity-batch-processor');
    deleteMock.mockResolvedValue(undefined);

    const result = await batchProcessor.deleteListingsBatch(['listing-99']);

    expect(deleteMock).toHaveBeenCalledWith('listing-99');
    expect(result.successCount).toBe(1);
  });
});
