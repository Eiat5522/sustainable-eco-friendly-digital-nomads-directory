import { render, screen } from '@testing-library/react';
import { Separator } from '../separator';

// Mock Radix UI Separator
jest.mock('@radix-ui/react-separator', () => ({
  Root: jest.fn(({ children, ...props }) => <div data-testid="separator-root" {...props}>{children}</div>),
}));

describe('Separator', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      expect(separator).toBeInTheDocument();
    });

    it('applies default orientation styling', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      expect(separator).toHaveClass('h-[1px]');
      expect(separator).toHaveClass('w-full');
    });

    it('applies base styling classes', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      expect(separator).toHaveClass('shrink-0');
      expect(separator).toHaveClass('bg-border');
    });
  });

  describe('Orientation', () => {
    it('renders horizontal separator', () => {
      const { container } = render(<Separator orientation="horizontal" />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      
      expect(separator).toHaveClass('h-[1px]');
      expect(separator).toHaveClass('w-full');
    });

    it('renders vertical separator', () => {
      const { container } = render(<Separator orientation="vertical" />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      
      expect(separator).toHaveClass('h-full');
      expect(separator).toHaveClass('w-[1px]');
    });

    it('defaults to horizontal when orientation not specified', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      
      expect(separator).toHaveClass('h-[1px]');
      expect(separator).toHaveClass('w-full');
    });
  });

  describe('Decorative Prop', () => {
    it('renders as decorative by default', () => {
      const { container } = render(<Separator />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      // Props are passed to the mocked Root component
      expect(separator).toBeInTheDocument();
    });

    it('renders as non-decorative when specified', () => {
      const { container } = render(<Separator decorative={false} />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      expect(separator).toBeInTheDocument();
    });

    it('accepts explicit decorative true', () => {
      const { container } = render(<Separator decorative={true} />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<Separator className="custom-class" />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      
      expect(separator).toHaveClass('custom-class');
      expect(separator).toHaveClass('shrink-0'); // Still has base classes
    });

    it('merges custom className with default classes', () => {
      const { container } = render(<Separator className="my-4 opacity-50" />);
      const separator = container.querySelector('[data-testid="separator-root"]');
      
      expect(separator).toHaveClass('my-4');
      expect(separator).toHaveClass('opacity-50');
      expect(separator).toHaveClass('bg-border');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Separator ref={ref as React.RefObject<HTMLDivElement>} />);
      
      expect(ref.current).not.toBeNull();
    });
  });

  describe('Additional Props', () => {
    it('forwards additional HTML attributes', () => {
      render(<Separator data-testid="custom-separator" id="sep-1" />);
      
      // Mocked component receives props and renders with custom testid
      const separator = screen.getByTestId('custom-separator');
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveAttribute('id', 'sep-1');
    });

    it('forwards aria attributes', () => {
      const { container } = render(
        <Separator aria-label="Content divider" />
      );
      const separator = container.querySelector('[data-testid="separator-root"]');
      
      expect(separator).toHaveAttribute('aria-label', 'Content divider');
    });
  });

  describe('Combinations', () => {
    it('renders vertical separator with custom className', () => {
      const { container } = render(
        <Separator orientation="vertical" className="h-20 mx-4" />
      );
      const separator = container.querySelector('[data-testid="separator-root"]');
      
      expect(separator).toHaveClass('h-20');
      expect(separator).toHaveClass('mx-4');
      expect(separator).toHaveClass('w-[1px]');
    });

    it('renders horizontal separator with custom props', () => {
      const { container } = render(
        <Separator 
          orientation="horizontal" 
          decorative={false}
          className="bg-red-500"
          aria-label="Section divider"
        />
      );
      const separator = container.querySelector('[data-testid="separator-root"]');
      
      expect(separator).toHaveClass('bg-red-500');
      expect(separator).toHaveClass('h-[1px]');
      expect(separator).toHaveAttribute('aria-label', 'Section divider');
    });
  });
});
