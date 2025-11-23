import { SanityImageUploader } from '../sanity-image-uploader';

jest.mock('../sanity-http-client', () => {
  const uploadAsset = jest.fn();
  const remove = jest.fn();
  const update = jest.fn();
  return {
    sanityHTTPClient: {
      uploadAsset,
      delete: remove,
      update,
    },
  };
});

const { sanityHTTPClient } = jest.requireMock('../sanity-http-client') as {
  sanityHTTPClient: {
    uploadAsset: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
  };
};

const uploadAssetMock = sanityHTTPClient.uploadAsset;
const deleteMock = sanityHTTPClient.delete;
const updateMock = sanityHTTPClient.update;

describe('SanityImageUploader', () => {
  let uploader: SanityImageUploader;
  let originalURLCreate: typeof URL.createObjectURL | undefined;
  let originalURLRevoke: typeof URL.revokeObjectURL | undefined;
  let originalImage: typeof Image;

  beforeAll(() => {
    if (typeof btoa === 'undefined') {
      (global as any).btoa = (input: string) => Buffer.from(input, 'binary').toString('base64');
    }
  });

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'proj';
    process.env.NEXT_PUBLIC_SANITY_DATASET = 'dataset';

    uploadAssetMock.mockReset();
    deleteMock.mockReset();
    updateMock.mockReset();

    uploader = new SanityImageUploader();

    originalURLCreate = URL.createObjectURL;
    originalURLRevoke = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    URL.revokeObjectURL = jest.fn();

    originalImage = (global as any).Image;

    class MockImage {
      public onload: () => void = () => {};
      public onerror: () => void = () => {};
      public naturalWidth = 1024;
      public naturalHeight = 768;
      set src(_value: string) {
        this.onload();
      }
    }

    (global as any).Image = MockImage as unknown as typeof Image;

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalURLCreate) {
      URL.createObjectURL = originalURLCreate;
    } else {
      delete (URL as any).createObjectURL;
    }
    if (originalURLRevoke) {
      URL.revokeObjectURL = originalURLRevoke;
    } else {
      delete (URL as any).revokeObjectURL;
    }
    (global as any).Image = originalImage;
    jest.restoreAllMocks();
  });

  it('uploads a single image with metadata and blur hash', async () => {
    uploadAssetMock.mockResolvedValue({ _id: 'asset-123', url: 'https://cdn.test/image' });

    const file = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });

    const result = await uploader.uploadImage(file, {
      title: 'Sample',
      description: 'Example image',
    });

    expect(uploadAssetMock).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        title: 'Sample',
        description: 'Example image',
      })
    );
    expect(result.asset._id).toBe('asset-123');
    expect(result.metadata).toMatchObject({
      width: 1024,
      height: 768,
      size: file.size,
      format: 'jpeg',
    });
    expect(result.metadata.blurHash).toContain('data:image/svg+xml;base64');
    expect(result.url).toContain(
      'https://cdn.sanity.io/images/proj/dataset/asset-123-800x600.webp'
    );
  });

  it('throws a descriptive error when validation fails', async () => {
    const invalidFile = new File([new Uint8Array([1])], 'note.txt', { type: 'text/plain' });

    await expect(uploader.uploadImage(invalidFile)).rejects.toThrow(
      'Unsupported file type: text/plain'
    );
    expect(uploadAssetMock).not.toHaveBeenCalled();
  });

  it('processes batches and reports progress while collecting failures', async () => {
    uploadAssetMock.mockResolvedValueOnce({ _id: 'asset-1' });

    const valid = new File([new Uint8Array([1, 2, 3])], 'valid.jpg', { type: 'image/jpeg' });
    const invalid = new File([new Uint8Array([4, 5, 6])], 'invalid.txt', { type: 'text/plain' });
    const onProgress = jest.fn();

    const result = await uploader.uploadBatch([valid, invalid], { onProgress });

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(result.successful[0].asset._id).toBe('asset-1');
    expect(result.failed[0].file.name).toBe('invalid.txt');
  });

  it('returns image variations with expected transformations', () => {
    const variations = uploader.getImageVariations('asset-xyz');

    expect(variations.thumbnail).toContain('asset-xyz-150x150.webp');
    expect(variations.original).toContain('asset-xyz.webp');
  });

  it('deletes images and propagates Sanity client errors', async () => {
    deleteMock.mockResolvedValueOnce(undefined);

    await expect(uploader.deleteImage('asset-1')).resolves.toBeUndefined();
    expect(deleteMock).toHaveBeenCalledWith('asset-1');

    const error = new Error('boom');
    deleteMock.mockRejectedValueOnce(error);

    await expect(uploader.deleteImage('asset-2')).rejects.toThrow(error);
  });

  it('updates metadata using the Sanity client', async () => {
    updateMock.mockResolvedValueOnce(undefined);

    await uploader.updateImageMetadata('asset-3', { title: 'Updated' });
    expect(updateMock).toHaveBeenCalledWith('asset-3', { title: 'Updated' });
  });
});
