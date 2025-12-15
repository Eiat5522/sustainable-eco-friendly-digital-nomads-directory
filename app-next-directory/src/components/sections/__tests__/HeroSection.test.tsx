import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { HeroSection } from '../HeroSection';

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon" />,
}));

jest.mock('@/components/ui/neo-input', () => ({
  NeoInput: ({ onChange, value, ...props }: React.ComponentProps<'input'>) => (
    <input data-testid="hero-search-input" value={value} onChange={onChange} {...props} />
  ),
}));

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, type = 'button', ...props }: React.PropsWithChildren<React.ComponentProps<'button'>>) => (
    <button type={type} data-testid="hero-search-button" {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/scroll-down-arrow', () => ({
  ScrollDownArrow: () => <div data-testid="scroll-indicator" />,
}));

describe('Home page HeroSection', () => {
  const push = jest.fn();
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    push.mockReset();
    mockUseRouter.mockReturnValue({ push });
  });

  it('renders the primary heading and search form', () => {
    render(<HeroSection />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'A Curated Directory For Sustainable Digital Nomads',
      })
    ).toBeInTheDocument();

    expect(screen.getByTestId('hero-search-input')).toHaveAttribute('type', 'search');
    expect(screen.getByTestId('scroll-indicator')).toBeInTheDocument();
  });

  it('submits a trimmed query string to the router', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    const input = screen.getByTestId('hero-search-input');
    await user.type(input, '  São Paulo  ');
    await user.click(screen.getByTestId('hero-search-button'));

    expect(push).toHaveBeenCalledWith('/search?q=S%C3%A3o%20Paulo');
  });

  it('ignores submissions when the query is empty after trimming', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    const input = screen.getByTestId('hero-search-input');
    await user.type(input, '   ');
    await user.click(screen.getByTestId('hero-search-button'));

    expect(push).not.toHaveBeenCalled();
  });
});
