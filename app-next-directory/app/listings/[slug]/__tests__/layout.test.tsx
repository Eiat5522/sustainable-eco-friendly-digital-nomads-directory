import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import ListingSlugLayout from '../layout';

describe('ListingSlugLayout', () => {
  it('renders children directly without additional wrapping', () => {
    const { getByText } = render(
      <ListingSlugLayout>
        <div>Test Content</div>
      </ListingSlugLayout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('passes through multiple children', () => {
    const { getByText } = render(
      <ListingSlugLayout>
        <div>First Child</div>
        <div>Second Child</div>
      </ListingSlugLayout>
    );

    expect(getByText('First Child')).toBeInTheDocument();
    expect(getByText('Second Child')).toBeInTheDocument();
  });

  it('does not add additional DOM elements', () => {
    const { container } = render(
      <ListingSlugLayout>
        <div data-testid="content">Test</div>
      </ListingSlugLayout>
    );

    // Should only have the fragment and the direct child
    expect(container.firstChild).toHaveAttribute('data-testid', 'content');
  });

  it('renders with complex children structure', () => {
    const { getByTestId } = render(
      <ListingSlugLayout>
        <div data-testid="wrapper">
          <h1>Title</h1>
          <p>Description</p>
        </div>
      </ListingSlugLayout>
    );

    expect(getByTestId('wrapper')).toBeInTheDocument();
  });
});
