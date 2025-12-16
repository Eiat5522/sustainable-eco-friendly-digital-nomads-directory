import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestimonialsSection } from '../TestimonialsSection';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt,
    src,
    onError,
    ...props
  }: {
    alt: string;
    src: string;
    onError?: React.ReactEventHandler<HTMLImageElement>;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    [key: string]: unknown;
  }) => {
    const { fill: _fill, priority: _priority, sizes: _sizes, ...imgProps } = props;
    return (
      <div
        role="img"
        aria-label={alt}
        data-src={src}
        data-testid="testimonial-avatar"
        {...imgProps}
      />
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
  NeoCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="neo-card" {...props}>
      {children}
    </div>
  ),
  NeoCardContent: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="neo-card-content" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/neo-badge', () => ({
  NeoBadge: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <span data-testid="neo-badge" {...props}>
      {children}
    </span>
  ),
}));

describe('TestimonialsSection', () => {
  it('renders all testimonials and their associated metadata', () => {
    render(<TestimonialsSection />);

    expect(screen.getByRole('heading', { level: 2, name: 'What Nomads Say' })).toBeInTheDocument();

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
