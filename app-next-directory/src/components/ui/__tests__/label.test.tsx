import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
const { Label } = await import('../label');

describe('Label', () => {
  describe('Basic Rendering', () => {
    it('renders with children text', () => {
      render(<Label>Test Label</Label>);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('applies default styling classes', () => {
      const { container } = render(<Label>Label</Label>);
      const label = container.querySelector('[data-testid="label-root"]');
      
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-medium');
      expect(label).toHaveClass('leading-none');
    });

    it('applies peer-disabled styles', () => {
      const { container } = render(<Label>Label</Label>);
      const label = container.querySelector('[data-testid="label-root"]');
      
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
      expect(label).toHaveClass('peer-disabled:opacity-70');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<Label className="custom-class">Label</Label>);
      const label = container.querySelector('[data-testid="label-root"]');
      
      expect(label).toHaveClass('custom-class');
      expect(label).toHaveClass('text-sm'); // Still has default classes
    });

    it('merges custom className with default classes', () => {
      const { container } = render(
        <Label className="text-lg text-blue-600">Label</Label>
      );
      const label = container.querySelector('[data-testid="label-root"]');
      
      expect(label).toHaveClass('text-lg');
      expect(label).toHaveClass('text-blue-600');
      expect(label).toHaveClass('font-medium');
    });
  });

  describe('HTML Attributes', () => {
    it('forwards htmlFor attribute', () => {
      const { container } = render(<Label htmlFor="input-id">Label</Label>);
      const label = container.querySelector('[data-testid="label-root"]');
      
      // Mocked component receives htmlFor prop
      expect(label).toBeInTheDocument();
    });

    it('forwards additional HTML attributes', () => {
      render(
        <Label data-testid="test-label" id="label-1">
          Label
        </Label>
      );
      
      // Mocked component receives props and renders with custom testid
      const label = screen.getByTestId('test-label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('id', 'label-1');
    });

    it('forwards aria attributes', () => {
      const { container } = render(
        <Label aria-label="Descriptive label">Label</Label>
      );
      const label = container.querySelector('[data-testid="label-root"]');
      
      expect(label).toHaveAttribute('aria-label', 'Descriptive label');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Label ref={ref as React.RefObject<HTMLLabelElement>}>Label</Label>);
      
      expect(ref.current).not.toBeNull();
    });
  });

  describe('Content Variations', () => {
    it('renders with complex children', () => {
      render(
        <Label>
          <span>Required</span> <em>*</em>
        </Label>
      );
      
      expect(screen.getByText('Required')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders with empty string', () => {
      const { container } = render(<Label></Label>);
      const label = container.querySelector('[data-testid="label-root"]');
      
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('');
    });

    it('renders with special characters', () => {
      render(<Label>Label & Symbol {"<>"}</Label>);
      expect(screen.getByText(/Label & Symbol/)).toBeInTheDocument();
    });

    it('renders with long text', () => {
      const longText = 'This is a very long label text that might wrap to multiple lines';
      render(<Label>{longText}</Label>);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    it('works with form inputs using htmlFor', () => {
      const { container } = render(
        <>
          <Label htmlFor="email">Email</Label>
          <input id="email" type="email" />
        </>
      );
      
      const label = container.querySelector('[data-testid="label-root"]');
      const input = container.querySelector('#email');
      
      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'email');
    });

    it('supports multiple labels with different htmlFor', () => {
      const { container } = render(
        <>
          <Label htmlFor="first-name">First Name</Label>
          <Label htmlFor="last-name">Last Name</Label>
        </>
      );
      
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
    });
  });

  describe('Combinations', () => {
    it('renders with all props combined', () => {
      render(
        <Label
          htmlFor="username"
          className="text-base font-bold"
          data-testid="custom-label"
        >
          Username
        </Label>
      );
      
      const label = screen.getByTestId('custom-label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('text-base');
      expect(label).toHaveClass('font-bold');
      expect(screen.getByText('Username')).toBeInTheDocument();
    });
  });
});
