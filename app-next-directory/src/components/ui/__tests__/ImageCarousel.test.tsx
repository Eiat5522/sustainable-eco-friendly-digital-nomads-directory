import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageCarousel } from '../ImageCarousel';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: {
    fill?: boolean;
    priority?: boolean;
    alt?: string;
    [key: string]: unknown;
  }) => {
    const { fill, priority, alt = '', ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img {...rest} alt={alt} fill={fill?.toString()} priority={priority?.toString()} />
    );
  },
}));

const mockImages = ['/images/test-1.jpg', '/images/test-2.jpg', '/images/test-3.jpg'];

describe('ImageCarousel', () => {
  it('renders nothing when no images are provided', () => {
    const { container } = render(<ImageCarousel images={[]} alt="Test" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the carousel with the first image active', () => {
    render(<ImageCarousel images={mockImages} alt="Test" />);
    const image = screen.getByAltText('Test - Image 1');
    expect(image).toHaveAttribute('src', mockImages[0]);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('navigates to the next image when the next button is clicked', () => {
    render(<ImageCarousel images={mockImages} alt="Test" />);
    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);
    const image = screen.getByAltText('Test - Image 2');
    expect(image).toHaveAttribute('src', mockImages[1]);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('navigates to the previous image when the previous button is clicked', () => {
    render(<ImageCarousel images={mockImages} alt="Test" />);
    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);
    const image = screen.getByAltText('Test - Image 3');
    expect(image).toHaveAttribute('src', mockImages[2]);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('wraps around to the first image when on the last image and next is clicked', () => {
    render(<ImageCarousel images={mockImages} alt="Test" />);
    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton); // to 2
    fireEvent.click(nextButton); // to 3
    fireEvent.click(nextButton); // to 1
    const image = screen.getByAltText('Test - Image 1');
    expect(image).toHaveAttribute('src', mockImages[0]);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('navigates to a specific slide when a thumbnail is clicked', () => {
    render(<ImageCarousel images={mockImages} alt="Test" />);
    const thumbnail = screen.getByAltText('Test thumbnail 3');
    fireEvent.click(thumbnail.parentElement!);
    const image = screen.getByAltText('Test - Image 3');
    expect(image).toHaveAttribute('src', mockImages[2]);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('does not render navigation buttons or thumbnails for a single image', () => {
    render(<ImageCarousel images={[mockImages[0]]} alt="Test" />);
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
    expect(screen.queryByAltText(/thumbnail/)).not.toBeInTheDocument();
  });
});
