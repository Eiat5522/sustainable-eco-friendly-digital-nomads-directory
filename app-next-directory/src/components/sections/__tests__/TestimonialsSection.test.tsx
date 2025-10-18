import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestimonialsSection } from '../TestimonialsSection';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src, onError, ...props }: any) => {
    const { fill: _fill, priority: _priority, sizes: _sizes, ...imgProps } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} src={src} onError={onError} data-testid="testimonial-avatar" {...imgProps} />
    );
  },
}));

jest.mock('lucide-react', () => ({
  Star: ({ className }: { className?: string }) => (
    <span data-testid="star" data-class={className} />
  ),
  Quote: () => <span data-testid="quote" />,
}));

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: ({ children, ...props }: any) => (
    <div data-testid="neo-card" {...props}>
      {children}
    </div>
  ),
  NeoCardContent: ({ children, ...props }: any) => (
    <div data-testid="neo-card-content" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/neo-badge', () => ({
  NeoBadge: ({ children, ...props }: any) => (
    <span data-testid="neo-badge" {...props}>
      {children}
    </span>
  ),
}));

describe('TestimonialsSection', () => {
  it('renders all testimonials and their associated metadata', () => {
    render(<TestimonialsSection />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'What Nomads Say' })
    ).toBeInTheDocument();

    const testimonials = screen.getAllByTestId('neo-card');
    expect(testimonials).toHaveLength(4);

    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Marcus Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('Emma Thompson')).toBeInTheDocument();

    const ratingLabels = screen.getAllByText(/out of 5 stars/);
    expect(ratingLabels).toHaveLength(3);
  });

  it('exposes call-to-action links for sharing experiences', () => {
    render(<TestimonialsSection />);

    const reviewLink = screen.getByRole('link', { name: 'Write a Review' });
    expect(reviewLink).toHaveAttribute('href', '/write-review');

    const communityLink = screen.getByRole('link', { name: 'Join Community' });
    expect(communityLink).toHaveAttribute('href', '/community');
  });

  it('falls back to a default avatar when image loading fails', () => {
    render(<TestimonialsSection />);

    const [firstAvatar] = screen.getAllByTestId('testimonial-avatar');
    expect(firstAvatar).toHaveAttribute('src', expect.stringContaining('pravatar'));

    fireEvent.error(firstAvatar);

    expect(firstAvatar).toHaveAttribute('src', '/images/default-avatar.png');
  });
});
