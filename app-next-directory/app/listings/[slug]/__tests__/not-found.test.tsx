import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import NotFound from '../not-found';

describe('app/listings/[slug]/not-found', () => {
  it('renders a helpful 404 message with navigation links', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: /404 - listing not found/i })).toBeInTheDocument();
    expect(screen.getByText(/couldn['’]t find this listing/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /browse listings/i })).toHaveAttribute(
      'href',
      '/listings'
    );
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/');
  });
});
