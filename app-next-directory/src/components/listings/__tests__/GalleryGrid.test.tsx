import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryGrid from '../GalleryGrid';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src, onError, ...rest }: any) => {
    const { fill: _fill, priority: _priority, sizes: _sizes, ...imgProps } = rest;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} src={src} onError={onError} data-mock-image {...imgProps} />
    );
  },
}));

describe('GalleryGrid', () => {
  it('returns null when there are no usable images', () => {
    const { container } = render(<GalleryGrid images={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('gallery-grid')).not.toBeInTheDocument();
  });

  it('normalizes input sources and renders accessible thumbnails', () => {
    render(
      <GalleryGrid
        images={[
          { url: 'first.jpg', alt: 'First image' },
          'second.jpg',
        ]}
      />
    );

    const thumbnails = screen.getAllByTestId('gallery-thumbnail');
    expect(thumbnails).toHaveLength(2);

    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('src', 'first.jpg');
    expect(imgs[0]).toHaveAttribute('alt', 'First image');
    expect(imgs[1]).toHaveAttribute('src', 'second.jpg');
    expect(imgs[1]).toHaveAttribute('alt', 'Gallery image 2');
  });

  it('supports lightbox navigation and closes with keyboard shortcuts', async () => {
    render(
      <GalleryGrid
        images={[{ url: 'first.jpg', alt: 'First image' }, { url: 'second.jpg', alt: 'Second image' }]}
      />
    );

    const user = userEvent.setup();
    const [firstThumbnail] = screen.getAllByTestId('gallery-thumbnail');
    await user.click(firstThumbnail);

    const lightbox = await screen.findByTestId('gallery-lightbox');
    expect(lightbox).toBeInTheDocument();

    expect(screen.getByRole('img', { name: 'Preview 1' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getByRole('img', { name: 'Preview 2' })).toBeInTheDocument());

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    await waitFor(() => expect(screen.getByRole('img', { name: 'Preview 1' })).toBeInTheDocument());

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(lightbox).not.toBeInTheDocument());
    await waitFor(() => expect(firstThumbnail).toHaveFocus());
  });

  it('traps focus within the modal controls while open', async () => {
    render(
      <GalleryGrid
        images={[{ url: 'one.jpg' }, { url: 'two.jpg' }]}
      />
    );

    const user = userEvent.setup();
    const [firstThumbnail] = screen.getAllByTestId('gallery-thumbnail');
    await user.click(firstThumbnail);

    const lightbox = await screen.findByTestId('gallery-lightbox');
    const closeButton = screen.getByRole('button', { name: 'Close preview' });
    const prevButton = screen.getByRole('button', { name: 'Previous image' });
    const nextButton = screen.getByRole('button', { name: 'Next image' });

    await waitFor(() => expect(closeButton).toHaveFocus());

    nextButton.focus();
    fireEvent.keyDown(lightbox, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    closeButton.focus();
    fireEvent.keyDown(lightbox, { key: 'Tab', shiftKey: true });
    expect(nextButton).toHaveFocus();

    prevButton.focus();
    fireEvent.keyDown(lightbox, { key: 'Tab' });
    expect(prevButton).toHaveFocus();
  });

  it('ignores galleries that only contain the fallback image', () => {
    const { container } = render(
      <GalleryGrid
        images={['/placeholder_image.png', '/placeholder_image.png']}
        fallback="/placeholder_image.png"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
