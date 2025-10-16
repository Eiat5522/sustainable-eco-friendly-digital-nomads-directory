import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockGalleryGrid = jest.fn(({ images }: { images: string[] }) => (
  <div data-testid="mock-gallery-grid" data-count={images.length}>
    {images.join(',')}
  </div>
));

jest.mock('@/components/listings/GalleryGrid', () => ({
  __esModule: true,
  default: (props: { images: string[] }) => mockGalleryGrid(props),
}));

describe('TestGalleryPage', () => {
  beforeEach(() => {
    mockGalleryGrid.mockClear();
  });

  it('renders the gallery test headings and layout copy', async () => {
    const { default: TestGalleryPage } = await import('../test-gallery/page');

    render(<TestGalleryPage />);

    expect(screen.getByRole('heading', { name: 'Gallery Test Page' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Gallery with Few Images (3 images)',
        level: 2,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Gallery with Many Images (12 images) - Testing Overlap Issue',
        level: 2,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Component Below Gallery')).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.startsWith('This component is placed below the gallery to test if the gallery images overlap with it.')
      )
    ).toBeInTheDocument();
  });

  it('passes the expected image sets to GalleryGrid for both scenarios', async () => {
    const { default: TestGalleryPage } = await import('../test-gallery/page');

    render(<TestGalleryPage />);

    expect(mockGalleryGrid).toHaveBeenCalledTimes(2);

    const [fewImagesCall, manyImagesCall] = mockGalleryGrid.mock.calls as Array<[
      { images: string[] }
    ]>;

    expect(fewImagesCall[0].images).toEqual([
      'https://picsum.photos/seed/1/400/300',
      'https://picsum.photos/seed/2/400/300',
      'https://picsum.photos/seed/3/400/300',
    ]);

    const manyImages = manyImagesCall[0].images;
    expect(manyImages).toHaveLength(12);
    expect(manyImages[0]).toBe('https://picsum.photos/seed/4/400/300');
    expect(manyImages[11]).toBe('https://picsum.photos/seed/15/400/300');

    const renderedGrids = screen.getAllByTestId('mock-gallery-grid');
    expect(renderedGrids).toHaveLength(2);
    expect(renderedGrids[0]).toHaveAttribute('data-count', '3');
    expect(renderedGrids[1]).toHaveAttribute('data-count', '12');
  });
});
