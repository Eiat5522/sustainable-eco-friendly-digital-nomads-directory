// Jest unit tests for getListingImages.js
const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path');

const { getListingImages } = require('../getListingImages.js');

describe('getListingImages', () => {
  const listingId = 'test-listing';

  beforeEach(() => {
    jest.clearAllMocks();
    path.join.mockImplementation((...args) => args.join('/'));
  });

  it('returns URLs for image files in the directory', () => {
    fs.readdirSync.mockReturnValue(['a.jpg', 'b.png', 'c.svg', 'd.txt', 'e.JPEG']);
    const result = getListingImages(listingId);
    expect(result).toEqual([
      `/images/listings/${listingId}/a.jpg`,
      `/images/listings/${listingId}/b.png`,
      `/images/listings/${listingId}/c.svg`,
      `/images/listings/${listingId}/e.JPEG`,
    ]);
  });

  it('filters out non-image files', () => {
    fs.readdirSync.mockReturnValue(['file.txt', 'image.gif', 'photo.jpeg']);
    const result = getListingImages(listingId);
    expect(result).toEqual([
      `/images/listings/${listingId}/photo.jpeg`,
    ]);
  });

  it('returns empty array and logs error if directory does not exist', () => {
    const error = new Error('ENOENT: no such file or directory');
    fs.readdirSync.mockImplementation(() => { throw error; });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = getListingImages(listingId);
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Error reading images for listing ${listingId}:`,
      error.message
    );
    consoleSpy.mockRestore();
  });

  it('returns empty array and logs error for other errors', () => {
    const error = new Error('Some other error');
    fs.readdirSync.mockImplementation(() => { throw error; });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = getListingImages(listingId);
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Error reading images for listing ${listingId}:`,
      error.message
    );
    consoleSpy.mockRestore();
  });

  it('returns empty array if directory is empty', () => {
    fs.readdirSync.mockReturnValue([]);
    const result = getListingImages(listingId);
    expect(result).toEqual([]);
  });
});
