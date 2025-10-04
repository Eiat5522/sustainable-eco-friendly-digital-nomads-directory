import { render, screen } from '@testing-library/react';
import { AnalyticsProvider } from '../AnalyticsProvider';

describe('AnalyticsProvider', () => {
  it('renders children without modification', () => {
    render(
      <AnalyticsProvider>
        <div data-testid="test-child">Test Content</div>
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('test-child')).toHaveTextContent('Test Content');
  });

  it('acts as a pass-through provider', () => {
    const { container } = render(
      <AnalyticsProvider>
        <span>Child 1</span>
        <span>Child 2</span>
      </AnalyticsProvider>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('renders with null children', () => {
    const { container } = render(<AnalyticsProvider>{null}</AnalyticsProvider>);
    expect(container).toBeInTheDocument();
  });

  it('renders with undefined children', () => {
    const { container } = render(<AnalyticsProvider>{undefined}</AnalyticsProvider>);
    expect(container).toBeInTheDocument();
  });

  it('handles complex children structures', () => {
    render(
      <AnalyticsProvider>
        <div>
          <p>Nested</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      </AnalyticsProvider>
    );

    expect(screen.getByText('Nested')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('handles conditional children', () => {
    const shouldRender = true;
    render(
      <AnalyticsProvider>
        {shouldRender && <div>Conditional Content</div>}
      </AnalyticsProvider>
    );

    expect(screen.getByText('Conditional Content')).toBeInTheDocument();
  });

  it('handles mixed ReactNode types', () => {
    render(
      <AnalyticsProvider>
        <span>Text</span>
        {123}
        <div>Element</div>
      </AnalyticsProvider>
    );

    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('Element')).toBeInTheDocument();
  });

  it('does not wrap children in additional elements', () => {
    const { container } = render(
      <AnalyticsProvider>
        <div data-testid="direct-child">Content</div>
      </AnalyticsProvider>
    );

    // The direct child should be a direct child of the container div
    const child = screen.getByTestId('direct-child');
    expect(container.firstChild).toBe(child);
  });

  it('preserves children props and attributes', () => {
    render(
      <AnalyticsProvider>
        <button data-testid="btn" onClick={() => {}}>
          Click me
        </button>
      </AnalyticsProvider>
    );

    const button = screen.getByTestId('btn');
    expect(button).toHaveAttribute('data-testid', 'btn');
    expect(button).toHaveTextContent('Click me');
  });
});
