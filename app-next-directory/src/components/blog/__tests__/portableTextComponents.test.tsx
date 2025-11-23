import type { PortableTextComponentProps } from '@portabletext/react';
import { render, screen } from '@testing-library/react';

const imageOrFallbackMock = jest.fn(() => 'mocked-image-src');

jest.mock('@/lib/dto-transformer', () => ({
  imageOrFallback: (...args: unknown[]) => imageOrFallbackMock(...args),
}));

describe('blogPortableTextComponents image renderer', () => {
  beforeEach(() => {
    imageOrFallbackMock.mockClear();
  });

  const importRenderer = async () => {
    const componentsModule = await import('../portableTextComponents');
    const renderer = componentsModule.blogPortableTextComponents.types?.image;
    if (!renderer) {
      throw new Error('Image renderer is not defined');
    }
    return renderer;
  };

  it('renders images using rounded Sanity dimensions and trimmed alt text', async () => {
    const renderer = await importRenderer();
    const value = {
      asset: {
        metadata: {
          dimensions: {
            width: 1024.4,
            height: 768.6,
          },
        },
      },
      alt: '  Scenic trail  ',
    } satisfies PortableTextComponentProps<'image'>['value'];

    render(renderer({ value }));

    expect(imageOrFallbackMock).toHaveBeenCalledWith(value, 1024, 769);
    const figure = screen.getByRole('figure');
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'mocked-image-src');
    expect(image).toHaveAttribute('alt', 'Scenic trail');
    expect(image).toHaveAttribute('width', '1024');
    expect(image).toHaveAttribute('height', '769');
    expect(figure.querySelector('figcaption')).toBeNull();
  });

  it('falls back to default dimensions and uses caption when alt text is empty', async () => {
    const renderer = await importRenderer();
    const value = {
      asset: {
        metadata: {
          dimensions: {
            width: null,
            height: Number.NaN,
          },
        },
      },
      alt: '   ',
      caption: '  Mountain view  ',
    } satisfies PortableTextComponentProps<'image'>['value'];

    render(renderer({ value }));

    expect(imageOrFallbackMock).toHaveBeenCalledWith(value, 1200, 800);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Mountain view');
    expect(screen.getByText('Mountain view')).toBeInTheDocument();
  });

  it('provides default text when both alt and caption are missing', async () => {
    const renderer = await importRenderer();
    const value = {
      asset: {},
      alt: 123,
      caption: null,
    } satisfies PortableTextComponentProps<'image'>['value'];

    render(renderer({ value }));

    const figure = screen.getByRole('figure');
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Blog illustration');
    expect(figure.querySelector('figcaption')).toBeNull();
  });
});
