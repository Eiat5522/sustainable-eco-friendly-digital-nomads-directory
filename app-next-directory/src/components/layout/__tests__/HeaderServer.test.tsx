/**
 * Unit tests for HeaderServer.tsx
 * Tests the server-rendered header component
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { HeaderServer } from '../HeaderServer';

// Mock child components
jest.mock('../MobileMenu', () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-menu">Mobile Menu</div>,
}));

jest.mock('../UserAuthStatus', () => ({
  __esModule: true,
  default: () => <div data-testid="user-auth-status">User Auth Status</div>,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src, ...props }: any) =>
    require('react').createElement('img', { alt, src, 'data-testid': 'next-image', ...props }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('HeaderServer', () => {
  it('should render the header with logo', () => {
    render(<HeaderServer />);

    const logo = screen.getByAltText('Sustainable Nomads');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/leaf-laptop-logo.png');
  });

  it('should render navigation links', () => {
    render(<HeaderServer />);

    const links = screen.getAllByRole('link');
    const homeLink = links.find(link => link.textContent === 'Home');
    const searchLink = links.find(link => link.textContent === 'Search');
    const categoriesLink = links.find(link => link.textContent === 'Categories');
    const blogLink = links.find(link => link.textContent === 'Blog');
    const contactLink = links.find(link => link.textContent === 'Contact Us');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(searchLink).toHaveAttribute('href', '/search');
    expect(categoriesLink).toHaveAttribute('href', '/categories');
    expect(blogLink).toHaveAttribute('href', '/blog');
    expect(contactLink).toHaveAttribute('href', '/contact-us');
  });

  it('should render MobileMenu component', () => {
    render(<HeaderServer />);

    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
  });

  it('should render UserAuthStatus component wrapped in Suspense', () => {
    render(<HeaderServer />);

    expect(screen.getByTestId('user-auth-status')).toBeInTheDocument();
  });

  it('should have proper header structure', () => {
    const { container } = render(<HeaderServer />);

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('border-b-4', 'border-neo-border');
  });

  it('should have navigation with proper ARIA role', () => {
    render(<HeaderServer />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should have logo link with aria-label for accessibility', () => {
    render(<HeaderServer />);

    const logoLink = screen.getByLabelText('Go to homepage');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should render all navigation links with proper styles', () => {
    render(<HeaderServer />);

    const links = screen.getAllByRole('link');
    const homeLink = links.find(link => link.textContent === 'Home');
    expect(homeLink).toHaveClass('body-md', 'hover:text-neo-primary');
  });
});
