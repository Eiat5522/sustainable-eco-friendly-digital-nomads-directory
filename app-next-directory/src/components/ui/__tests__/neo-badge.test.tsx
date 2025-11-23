import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { NeoBadge } from '../neo-badge';

describe('NeoBadge', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      const { getByText } = render(<NeoBadge>Test Badge</NeoBadge>);
      expect(getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders with default variant and size', () => {
      const { getByText } = render(<NeoBadge>Default</NeoBadge>);
      const badge = getByText('Default');

      expect(badge).toHaveClass('bg-neo-primary');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });

    it('applies base classes', () => {
      const { getByText } = render(<NeoBadge>Badge</NeoBadge>);
      const badge = getByText('Badge');

      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('border-2');
      expect(badge).toHaveClass('border-neo-border');
      expect(badge).toHaveClass('font-semibold');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { getByText } = render(<NeoBadge variant="default">Default</NeoBadge>);
      const badge = getByText('Default');

      expect(badge).toHaveClass('bg-neo-primary');
    });

    it('renders secondary variant', () => {
      const { getByText } = render(<NeoBadge variant="secondary">Secondary</NeoBadge>);
      const badge = getByText('Secondary');

      expect(badge).toHaveClass('bg-neo-secondary');
      expect(badge).toHaveClass('text-neo-text-primary');
    });

    it('renders accent variant', () => {
      const { getByText } = render(<NeoBadge variant="accent">Accent</NeoBadge>);
      const badge = getByText('Accent');

      expect(badge).toHaveClass('bg-neo-accent');
    });

    it('renders success variant', () => {
      const { getByText } = render(<NeoBadge variant="success">Success</NeoBadge>);
      const badge = getByText('Success');

      expect(badge).toHaveClass('bg-neo-success');
    });

    it('renders outline variant', () => {
      const { getByText } = render(<NeoBadge variant="outline">Outline</NeoBadge>);
      const badge = getByText('Outline');

      expect(badge).toHaveClass('bg-transparent');
      expect(badge).toHaveClass('text-neo-text-primary');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { getByText } = render(<NeoBadge size="sm">Small</NeoBadge>);
      const badge = getByText('Small');

      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('renders medium size', () => {
      const { getByText } = render(<NeoBadge size="md">Medium</NeoBadge>);
      const badge = getByText('Medium');

      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });

    it('renders large size', () => {
      const { getByText } = render(<NeoBadge size="lg">Large</NeoBadge>);
      const badge = getByText('Large');

      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { getByText } = render(<NeoBadge className="custom-class">Custom</NeoBadge>);
      const badge = getByText('Custom');

      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('bg-neo-primary'); // Still has default classes
    });

    it('forwards additional HTML attributes', () => {
      const { getByTestId } = render(
        <NeoBadge data-testid="test-badge" id="badge-id">
          Attributes
        </NeoBadge>
      );
      const badge = getByTestId('test-badge');

      expect(badge).toHaveAttribute('data-testid', 'test-badge');
      expect(badge).toHaveAttribute('id', 'badge-id');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<NeoBadge ref={ref}>Ref Test</NeoBadge>);

      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      const { getByText } = render(<NeoBadge>Focus Test</NeoBadge>);
      const badge = getByText('Focus Test');

      expect(badge).toHaveClass('focus:outline-none');
      expect(badge).toHaveClass('focus:ring-ring');
      expect(badge).toHaveClass('focus:ring-offset-2');
    });

    it('has transition classes for smooth state changes', () => {
      const { getByText } = render(<NeoBadge>Transition</NeoBadge>);
      const badge = getByText('Transition');

      expect(badge).toHaveClass('transition-colors');
    });
  });

  describe('Combinations', () => {
    it('renders with variant and size combinations', () => {
      const { getByText } = render(
        <NeoBadge variant="accent" size="lg">
          Large Accent
        </NeoBadge>
      );
      const badge = getByText('Large Accent');

      expect(badge).toHaveClass('bg-neo-accent');
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-base');
    });

    it('renders with all custom props', () => {
      const { getByTestId } = render(
        <NeoBadge variant="success" size="sm" className="my-custom-class" data-testid="full-test">
          Full Props
        </NeoBadge>
      );
      const badge = getByTestId('full-test');

      expect(badge).toHaveClass('bg-neo-success');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('my-custom-class');
      expect(badge).toHaveAttribute('data-testid', 'full-test');
    });
  });
});
