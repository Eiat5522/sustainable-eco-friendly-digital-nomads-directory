import { SanityBatchProcessor } from '../sanity-batch-processor';

type Listing = Parameters<SanityBatchProcessor['createListingsBatch']>[0][number];

jest.mock('../sanity-http-client', () => {
  const create = jest.fn();
  const update = jest.fn();
  const remove = jest.fn();
  return {
    sanityHTTPClient: {
      create,
      update,
      delete: remove,
    },
  };
});

jest.mock('../sanity-image-uploader', () => {
  const uploadBatch = jest.fn();
  return {
    imageUploader: {
      uploadBatch,
    },
  };
});

const { sanityHTTPClient } = jest.requireMock('../sanity-http-client') as {
  sanityHTTPClient: {
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const { imageUploader } = jest.requireMock('../sanity-image-uploader') as {
  imageUploader: {
    uploadBatch: jest.Mock;
  };
};

const sanityCreateMock = sanityHTTPClient.create;
const sanityUpdateMock = sanityHTTPClient.update;
const sanityDeleteMock = sanityHTTPClient.delete;
const uploadBatchMock = imageUploader.uploadBatch;

describe('SanityBatchProcessor', () => {
  let processor: SanityBatchProcessor;
  let baseListing: Listing;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new SanityBatchProcessor();
    baseListing = {
      name: 'Eco Stay',
      type: 'accommodation',
      city: 'Lisbon',
      country: 'Portugal',
      description: '  Beautiful place  ',
      website: 'https://example.com',
      ecoTags: ['solar'],
      address: '  Green street  ',
    };

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validates listings and returns early when validateOnly is true', async () => {
    const invalidListing = { ...baseListing, name: '' };
    const result = await processor.createListingsBatch([baseListing, invalidListing], { validateOnly: true });

    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(1);
    expect(result.summary).toContain('1 valid');
    expect(result.failed[0].error).toBe('Name is required');
    expect(sanityCreateMock).not.toHaveBeenCalled();
  });

  it('processes listings with image uploads and retries transient failures', async () => {
    const listing: Listing = {
      ...baseListing,
      images: [new File([new Uint8Array([1])], 'image.jpg', { type: 'image/jpeg' })],
      coordinates: { lat: 10, lng: 20 },
    };

    uploadBatchMock.mockResolvedValue({
      successful: [
        { asset: { _id: 'image-1' }, metadata: { width: 100, height: 50, size: 12, format: 'jpeg' }, url: 'url' },
      ],
      failed: [{ file: listing.images![0], error: 'oops' }],
      total: 1,
      successCount: 1,
      failureCount: 0,
    });

    sanityCreateMock
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce({ _id: 'listing-1' });

    (processor as any).retryDelay = 0;

    const result = await processor.createListingsBatch([listing], { concurrency: 1 });

    expect(uploadBatchMock).toHaveBeenCalledWith(listing.images, expect.objectContaining({ concurrency: 2 }));
    expect(sanityCreateMock).toHaveBeenCalledTimes(2);
    expect(result.successCount).toBe(1);
    expect(result.successful[0].id).toBe('listing-1');
    const payload = sanityCreateMock.mock.calls.at(-1)?.[0];
    expect(payload).toMatchObject({
      _type: 'listing',
      name: 'Eco Stay',
      city: 'Lisbon',
      country: 'Portugal',
      description: 'Beautiful place',
      address: 'Green street',
      coordinates: { lat: 10, lng: 20, _type: 'geopoint' },
    });
    expect(payload.images[0].asset._ref).toBe('image-1');
  });

  it('skips image processing when skipImages is enabled', async () => {
    sanityCreateMock.mockResolvedValue({ _id: 'listing-2' });

    const listing: Listing = { ...baseListing, images: [new File([new Uint8Array([1])], 'skip.jpg', { type: 'image/jpeg' })] };

    const result = await processor.createListingsBatch([listing], { skipImages: true });

    expect(uploadBatchMock).not.toHaveBeenCalled();
    expect(result.successCount).toBe(1);
  });

  it('aggregates update results and failures', async () => {
    sanityUpdateMock.mockResolvedValueOnce({ _id: 'a' });
    sanityUpdateMock.mockRejectedValueOnce(new Error('boom'));

    const progress = jest.fn();
    const result = await processor.updateListingsBatch(
      [
        { id: 'a', data: { name: 'First' } },
        { id: 'b', data: { name: 'Second' } },
      ],
      { onProgress: progress },
    );

    expect(progress).toHaveBeenCalledWith(0, 2, 'Updating listing');
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(result.failed[0].data.id).toBe('b');
  });

  it('aggregates deletion results and failures', async () => {
    sanityDeleteMock.mockResolvedValueOnce(undefined);
    sanityDeleteMock.mockRejectedValueOnce(new Error('nope'));

    const result = await processor.deleteListingsBatch(['one', 'two']);

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(result.failed[0].data).toBe('two');
  });

  it('enforces validation rules for individual listings', () => {
    const cases: Array<{ listing: Partial<Listing>; message: string }> = [
      { listing: { ...baseListing, name: ' ' }, message: 'Name is required' },
      { listing: { ...baseListing, type: 'invalid' }, message: 'Valid type is required (accommodation, coworking, cafe, activity)' },
      { listing: { ...baseListing, city: '' }, message: 'City is required' },
      { listing: { ...baseListing, country: '' }, message: 'Country is required' },
      { listing: { ...baseListing, website: 'not-a-url' }, message: 'Invalid website URL' },
      { listing: { ...baseListing, coordinates: { lat: 200, lng: 0 } as any }, message: 'Invalid latitude' },
      { listing: { ...baseListing, coordinates: { lat: 0, lng: -200 } as any }, message: 'Invalid longitude' },
      { listing: { ...baseListing, ecoTags: Array(11).fill('tag') }, message: 'Eco tags must be an array with max 10 items' },
      { listing: { ...baseListing, images: new Array(21).fill({}) as any }, message: 'Maximum 20 images allowed per listing' },
    ];

    for (const { listing, message } of cases) {
      expect(() => (processor as any).validateSingleListing(listing)).toThrow(message);
    }
  });
});
