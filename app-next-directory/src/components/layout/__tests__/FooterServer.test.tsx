/**
 * Unit tests for FooterServer.tsx
 * Tests the server-rendered footer component
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { FooterServer } from '../FooterServer';

// Mock child components
jest.mock('../NewsletterForm', () => ({
  NewsletterForm: () => <div data-testid="newsletter-form">Newsletter Form</div>,
}));

jest.mock('../FooterYear', () => ({
  FooterYear: () => <span data-testid="footer-year">2024</span>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Leaf: () => <span data-testid="icon-leaf">Leaf</span>,
  Mail: () => <span data-testid="icon-mail">Mail</span>,
  MapPin: () => <span data-testid="icon-mappin">MapPin</span>,
  MessageSquare: () => <span data-testid="icon-messagesquare">MessageSquare</span>,
  XIcon: () => <span data-testid="icon-x">X</span>,
}));

describe('FooterServer', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render footer with correct structure', () => {
    const { container } = render(<FooterServer />);

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('bg-neo-border', 'text-white', 'border-t-4');
  });

  it('should render newsletter form when showNewsletter is true', () => {
    render(<FooterServer showNewsletter={true} />);

    expect(screen.getByTestId('newsletter-form')).toBeInTheDocument();
  });

  it('should not render newsletter form when showNewsletter is false', () => {
    render(<FooterServer showNewsletter={false} />);

    expect(screen.queryByTestId('newsletter-form')).not.toBeInTheDocument();
  });

  it('should render all quick links', () => {
    render(<FooterServer />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Find Listings' })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute('href', '/categories');
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'Submit Your Business' })).toHaveAttribute(
      'href',
      '/contact-us'
    );
    expect(screen.getByRole('link', { name: 'Login / Register' })).toHaveAttribute(
      'href',
      '/auth/login'
    );
  });

  it('should render all category links', () => {
    render(<FooterServer />);

    expect(screen.getByRole('link', { name: 'Co-working Spaces' })).toHaveAttribute(
      'href',
      '/categories/coworking'
    );
    expect(screen.getByRole('link', { name: 'Cafes' })).toHaveAttribute('href', '/categories/cafe');
    expect(screen.getByRole('link', { name: 'Restaurants' })).toHaveAttribute(
      'href',
      '/categories/restaurant'
    );
    expect(screen.getByRole('link', { name: 'Accommodation' })).toHaveAttribute(
      'href',
      '/categories/accommodation'
    );
    expect(screen.getByRole('link', { name: 'Activities' })).toHaveAttribute(
      'href',
      '/categories/activities'
    );
  });

  it('should render social links with correct attributes', () => {
    render(<FooterServer />);

    const xLink = screen.getByLabelText('X (formerly Twitter)');
    expect(xLink).toHaveAttribute('href', 'https://twitter.com/sustainablenomads');
    expect(xLink).toHaveAttribute('target', '_blank');
    expect(xLink).toHaveAttribute('rel', 'noopener noreferrer');

    const emailLink = screen.getByLabelText('Email');
    expect(emailLink).toHaveAttribute('href', 'mailto:hello@sustainablenomads.com');
  });

  it('should render contact information', () => {
    render(<FooterServer />);

    expect(screen.getByText(/123 Green Street, Watthana, Bangkok/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /hello@sustainablenomads\.com/i })).toHaveAttribute(
      'href',
      'mailto:hello@sustainablenomads.com'
    );
    expect(screen.getByRole('link', { name: /send us a message/i })).toHaveAttribute(
      'href',
      '/contact-us'
    );
  });

  it('should display current year in copyright', () => {
    render(<FooterServer />);

    expect(screen.getByTestId('footer-year')).toBeInTheDocument();
    expect(screen.getByTestId('footer-year')).toHaveTextContent('2024');
    expect(screen.getByText(/Copyright/i)).toBeInTheDocument();
    expect(screen.getAllByText(/sustainablenomads/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should render brand name and tagline', () => {
    render(<FooterServer />);

    expect(screen.getByText('SustainableNomads')).toBeInTheDocument();
    expect(screen.getByText(/connecting conscious travelers/i)).toBeInTheDocument();
  });

  it('should render "Made with" section', () => {
    render(<FooterServer />);

    expect(screen.getByText('Made for the planet')).toBeInTheDocument();
  });

  it('should have proper heading structure', () => {
    render(<FooterServer />);

    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getAllByText('Categories').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('should render all icons', () => {
    render(<FooterServer />);

    expect(screen.getAllByTestId('icon-leaf').length).toBeGreaterThanOrEqual(2); // Brand and footer
    expect(screen.getAllByTestId('icon-x').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('icon-mail').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('icon-mappin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('icon-messagesquare').length).toBeGreaterThanOrEqual(1);
  });
});
