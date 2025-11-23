import { render, screen } from '@testing-library/react';

const galleryMock = jest.fn(({ images }: { images: string[] }) => (
  <div data-testid="gallery-grid-mock">{images.join('|')}</div>
));

jest.mock(
  '@/components/listings/GalleryGrid',
  () =>
    function MockGalleryGrid(props: { images: string[] }) {
      return galleryMock(props);
    }
);

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
      screen.getByText(
        /This component is placed below the gallery to test if the gallery images overlap/
      )
    ).toBeInTheDocument();
  });

  it('passes the expected image sets to GalleryGrid', async () => {
    const { default: TestGalleryPage } = await import('./page');
    render(<TestGalleryPage />);

    expect(galleryMock).toHaveBeenCalledTimes(2);

    expect(galleryMock).toHaveBeenNthCalledWith(1, {
      images: [
        'https://picsum.photos/seed/1/400/300',
        'https://picsum.photos/seed/2/400/300',
        'https://picsum.photos/seed/3/400/300',
      ],
    });

    // For the second call, check the array length and contents
    const manyImages = [
      'https://picsum.photos/seed/4/400/300',
      'https://picsum.photos/seed/5/400/300',
      'https://picsum.photos/seed/6/400/300',
      'https://picsum.photos/seed/7/400/300',
      'https://picsum.photos/seed/8/400/300',
      'https://picsum.photos/seed/9/400/300',
      'https://picsum.photos/seed/10/400/300',
      'https://picsum.photos/seed/11/400/300',
      'https://picsum.photos/seed/12/400/300',
      'https://picsum.photos/seed/13/400/300',
      'https://picsum.photos/seed/14/400/300',
      'https://picsum.photos/seed/15/400/300',
    ];
    expect(galleryMock).toHaveBeenNthCalledWith(2, {
      images: manyImages,
    });
    expect(manyImages).toHaveLength(12);
    expect(manyImages[0]).toBe('https://picsum.photos/seed/4/400/300');
    expect(manyImages[11]).toBe('https://picsum.photos/seed/15/400/300');
    expect(new Set(manyImages).size).toBe(12);
  });
});
