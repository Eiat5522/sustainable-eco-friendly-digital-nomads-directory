import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { AboutSection } from '../AboutSection';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href?: string; children?: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...(props as Record<string, unknown>)}>
      {children}
    </a>
  ),
}));

jest.mock('lucide-react', () => ({
  Leaf: () => <span data-testid="icon" />,
  Users: () => <span data-testid="icon" />,
  Globe: () => <span data-testid="icon" />,
  Heart: () => <span data-testid="icon" />,
}));

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="neo-card" {...(props as Record<string, unknown>)}>
      {children}
    </div>
  ),
  NeoCardContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="neo-card-content" {...(props as Record<string, unknown>)}>
      {children}
    </div>
  ),
}));

describe('AboutSection', () => {
  it('renders the mission statement and feature list', () => {
    render(<AboutSection />);

    expect(screen.getByRole('heading', { level: 2, name: 'Who We Are' })).toBeInTheDocument();
    expect(
      screen.getByText(/We're on a mission to make sustainable travel accessible/i)
    ).toBeInTheDocument();

    const featureTitles = [
      'Sustainability First',
      'Community Driven',
      'Global Network',
      'Impact Focused',
    ];
    for (const title of featureTitles) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
  });

  it('provides primary navigation actions to contribute and learn more', () => {
    render(<AboutSection />);

    const joinCard = screen.getByRole('heading', { level: 3, name: 'Join Our Mission' });
    const links = within(
      joinCard.closest('section') ?? screen.getByRole('region', { name: /about/i })
    ).getAllByRole('link');

    const addVenueLink = screen.getByRole('link', { name: 'Add a Venue' });
    expect(addVenueLink).toHaveAttribute('href', '/venues/new');

    const learnMoreLink = screen.getByRole('link', { name: 'Learn More' });
    expect(learnMoreLink).toHaveAttribute('href', '/about');

    expect(links).toEqual(expect.arrayContaining([addVenueLink, learnMoreLink]));
  });
});
