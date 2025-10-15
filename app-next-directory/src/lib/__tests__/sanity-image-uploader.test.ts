import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

const originalImage = global.Image;
const originalCreateObjectURL = global.URL.createObjectURL;
const originalRevokeObjectURL = global.URL.revokeObjectURL;

const uploadAssetMock = jest.fn();
const deleteMock = jest.fn();
const updateMock = jest.fn();

jest.mock('../sanity-http-client', () => ({
  sanityHTTPClient: {
    uploadAsset: uploadAssetMock,
    delete: deleteMock,
    update: updateMock,
  },
}));

describe('SanityImageUploader', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'proj',
      NEXT_PUBLIC_SANITY_DATASET: 'dataset',
    };

    uploadAssetMock.mockReset();
    deleteMock.mockReset();
    updateMock.mockReset();

    global.URL.createObjectURL = jest.fn(() => 'blob:123');
    global.URL.revokeObjectURL = jest.fn();

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 800;
      naturalHeight = 600;
      set src(_value: string) {
        setTimeout(() => this.onload && this.onload(), 0);
      }
    }

    // @ts-expect-error - override global for tests
    global.Image = MockImage;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    global.Image = originalImage;
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  const setup = async () => {
    const mod = await import('../sanity-image-uploader');
    return { ...mod };
  };

  it('uploads a single image and returns metadata', async () => {
    const { uploadImage } = await setup();

    uploadAssetMock.mockResolvedValue({ _id: 'asset-1' });

    const file = new File(['data'], 'eco.png', { type: 'image/png' });
    const result = await uploadImage(file, { title: 'Eco' });

    expect(uploadAssetMock).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ filename: 'eco.png', title: 'Eco' }),
    );
    expect(result.asset._id).toBe('asset-1');
    expect(result.metadata).toEqual(
      expect.objectContaining({ width: 800, height: 600, format: 'png' }),
    );
    expect(result.url).toContain('cdn.sanity.io/images/proj/dataset/asset-1');
  });

  it('processes a batch of images and reports failures', async () => {
    const { imageUploader } = await setup();

    const success = new File(['good'], 'good.jpg', { type: 'image/jpeg' });
    const failure = new File(['bad'], 'bad.jpg', { type: 'image/jpeg' });

    jest
      .spyOn(imageUploader, 'uploadImage')
      .mockResolvedValueOnce({
        asset: { _id: 'asset-1' } as any,
        url: 'https://cdn.sanity.io/image/asset-1',
        metadata: { width: 100, height: 100, size: 10, format: 'jpeg' },
      })
      .mockRejectedValueOnce(new Error('boom'));

    const progress = jest.fn();

    const result = await imageUploader.uploadBatch([success, failure], { onProgress: progress });

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(progress).toHaveBeenCalledWith(1, 2);
  });

  it('exposes helpers for URL variations and deletion', async () => {
    const { imageUploader } = await setup();

    const urls = imageUploader.getImageVariations('asset-xyz');
    expect(urls.original).toContain('asset-xyz');

    await imageUploader.deleteImage('asset-xyz');
    expect(deleteMock).toHaveBeenCalledWith('asset-xyz');

    await imageUploader.updateImageMetadata('asset-xyz', { title: 'New' });
    expect(updateMock).toHaveBeenCalledWith('asset-xyz', { title: 'New' });
  });
});
