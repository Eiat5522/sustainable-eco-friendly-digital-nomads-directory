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
  Instagram: () => <span data-testid="icon-instagram">Instagram</span>,
  Leaf: () => <span data-testid="icon-leaf">Leaf</span>,
  Linkedin: () => <span data-testid="icon-linkedin">LinkedIn</span>,
  Mail: () => <span data-testid="icon-mail">Mail</span>,
  MapPin: () => <span data-testid="icon-mappin">MapPin</span>,
  MessageSquare: () => <span data-testid="icon-messagesquare">MessageSquare</span>,
  Twitter: () => <span data-testid="icon-twitter">Twitter</span>,
}));

describe('FooterServer', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render footer with correct structure', () => {
    const { container } = render(<FooterServer />);

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('bg-neo-text-primary', 'text-white', 'border-t-4');
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
      '/search/results?category=coworking'
    );
    expect(screen.getByRole('link', { name: 'Cafes' })).toHaveAttribute(
      'href',
      '/search/results?category=cafe'
    );
    expect(screen.getByRole('link', { name: 'Restaurants' })).toHaveAttribute(
      'href',
      '/search/results?category=restaurant'
    );
    expect(screen.getByRole('link', { name: 'Accommodation' })).toHaveAttribute(
      'href',
      '/search/results?category=accommodation'
    );
    expect(screen.getByRole('link', { name: 'Activities' })).toHaveAttribute(
      'href',
      '/search/results?category=activities'
    );
  });

  it('should render social links with correct attributes', () => {
    render(<FooterServer />);

    const twitterLink = screen.getByLabelText('Twitter');
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/sustainablenomads');
    expect(twitterLink).toHaveAttribute('target', '_blank');
    expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');

    const instagramLink = screen.getByLabelText('Instagram');
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/sustainablenomads');

    const linkedinLink = screen.getByLabelText('LinkedIn');
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/company/sustainablenomads');

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
    expect(screen.getByText(/SustainableNomads\. All rights reserved\./i)).toBeInTheDocument();
  });

  it('should render brand name and tagline', () => {
    render(<FooterServer />);

    expect(screen.getByText('SustainableNomads')).toBeInTheDocument();
    expect(screen.getByText(/connecting conscious travelers/i)).toBeInTheDocument();
  });

  it('should render "Made with" section', () => {
    render(<FooterServer />);

    expect(screen.getByText('Made with')).toBeInTheDocument();
    expect(screen.getByText('for the planet')).toBeInTheDocument();
  });

  it('should have proper heading structure', () => {
    render(<FooterServer />);

    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });

  it('should render all icons', () => {
    render(<FooterServer />);

    expect(screen.getAllByTestId('icon-leaf').length).toBeGreaterThanOrEqual(2); // Brand and footer
    expect(screen.getAllByTestId('icon-twitter').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('icon-instagram').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('icon-linkedin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('icon-mail').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('icon-mappin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('icon-messagesquare').length).toBeGreaterThanOrEqual(1);
  });
});
