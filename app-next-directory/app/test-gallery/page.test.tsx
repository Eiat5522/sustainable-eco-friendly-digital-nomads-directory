import { render, screen } from '@testing-library/react';
import React from 'react';

const galleryMock = jest.fn(({ images }: { images: string[] }) => (
  <div data-testid="gallery-grid-mock">{images.join('|')}</div>
));

jest.mock('@/components/listings/GalleryGrid', () => (
  function MockGalleryGrid(props: { images: string[] }) {
    return galleryMock(props);
  }
));

describe('TestGalleryPage', () => {
  beforeEach(() => {
    galleryMock.mockClear();
  });

  it('renders headings and explanatory sections', async () => {
    const { default: TestGalleryPage } = await import('./page');
    render(<TestGalleryPage />);

    expect(screen.getByRole('heading', { name: 'Gallery Test Page' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Gallery with Few Images (3 images)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Gallery with Many Images (12 images) - Testing Overlap Issue',
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/Component Below Gallery/)).toBeInTheDocument();
    expect(
      screen.getByText(/This component is placed below the gallery to test if the gallery images overlap/)
    ).toBeInTheDocument();
  });

  it('passes the expected image sets to GalleryGrid', async () => {
    const { default: TestGalleryPage } = await import('./page');
    render(<TestGalleryPage />);

    expect(galleryMock).toHaveBeenCalledTimes(2);

    const [fewCall, manyCall] = galleryMock.mock.calls as [
      [{ images: string[] }],
      [{ images: string[] }],
    ];

    expect(fewCall[0].images).toHaveLength(3);
    expect(fewCall[0].images).toEqual([
      'https://picsum.photos/seed/1/400/300',
      'https://picsum.photos/seed/2/400/300',
      'https://picsum.photos/seed/3/400/300',
    ]);

    expect(manyCall[0].images).toHaveLength(12);
    expect(manyCall[0].images[0]).toBe('https://picsum.photos/seed/4/400/300');
    expect(manyCall[0].images[11]).toBe('https://picsum.photos/seed/15/400/300');
    expect(new Set(manyCall[0].images).size).toBe(12);
  });
});
