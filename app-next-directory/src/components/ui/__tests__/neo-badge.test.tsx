import { render } from '@testing-library/react';
import { NeoBadge } from '../neo-badge';

describe('NeoBadge', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      const { container } = render(<NeoBadge>Test Badge</NeoBadge>);
      expect(container.textContent).toBe('Test Badge');
    });

    it('renders with default variant and size', () => {
      const { container } = render(<NeoBadge>Default</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('bg-neo-primary');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });

    it('applies base classes', () => {
      const { container } = render(<NeoBadge>Badge</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
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
      const { container } = render(<NeoBadge variant="default">Default</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('bg-neo-primary');
      expect(badge).toHaveClass('text-white');
    });

    it('renders secondary variant', () => {
      const { container } = render(<NeoBadge variant="secondary">Secondary</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('bg-neo-secondary');
      expect(badge).toHaveClass('text-neo-text-primary');
    });

    it('renders accent variant', () => {
      const { container } = render(<NeoBadge variant="accent">Accent</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('bg-neo-accent');
      expect(badge).toHaveClass('text-white');
    });

    it('renders success variant', () => {
      const { container } = render(<NeoBadge variant="success">Success</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('bg-neo-success');
      expect(badge).toHaveClass('text-white');
    });

    it('renders outline variant', () => {
      const { container } = render(<NeoBadge variant="outline">Outline</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('bg-transparent');
      expect(badge).toHaveClass('text-neo-text-primary');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<NeoBadge size="sm">Small</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('renders medium size', () => {
      const { container } = render(<NeoBadge size="md">Medium</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });

    it('renders large size', () => {
      const { container } = render(<NeoBadge size="lg">Large</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(<NeoBadge className="custom-class">Custom</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('bg-neo-primary'); // Still has default classes
    });

    it('forwards additional HTML attributes', () => {
      const { container } = render(
        <NeoBadge data-testid="test-badge" id="badge-id">Attributes</NeoBadge>
      );
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveAttribute('data-testid', 'test-badge');
      expect(badge).toHaveAttribute('id', 'badge-id');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<NeoBadge ref={ref as React.RefObject<HTMLDivElement>}>Ref Test</NeoBadge>);
      
      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      const { container } = render(<NeoBadge>Focus Test</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('focus:outline-none');
      expect(badge).toHaveClass('focus:ring-2');
      expect(badge).toHaveClass('focus:ring-ring');
      expect(badge).toHaveClass('focus:ring-offset-2');
    });

    it('has transition classes for smooth state changes', () => {
      const { container } = render(<NeoBadge>Transition</NeoBadge>);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('transition-colors');
    });
  });

  describe('Combinations', () => {
    it('renders with variant and size combinations', () => {
      const { container } = render(
        <NeoBadge variant="accent" size="lg">Large Accent</NeoBadge>
      );
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('bg-neo-accent');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-base');
    });

    it('renders with all custom props', () => {
      const { container } = render(
        <NeoBadge 
          variant="success" 
          size="sm" 
          className="my-custom-class"
          data-testid="full-test"
        >
          Full Props
        </NeoBadge>
      );
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('bg-neo-success');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('my-custom-class');
      expect(badge).toHaveAttribute('data-testid', 'full-test');
    });
  });
});
