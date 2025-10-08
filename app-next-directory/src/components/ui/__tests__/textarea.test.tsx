import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  describe('Basic Rendering', () => {
    it('renders textarea element', () => {
      const { container } = render(<Textarea />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('applies default styling classes', () => {
      const { container } = render(<Textarea />);
      const textarea = container.querySelector('textarea');
      
      expect(textarea).toHaveClass('flex');
      expect(textarea).toHaveClass('min-h-[80px]');
      expect(textarea).toHaveClass('w-full');
      expect(textarea).toHaveClass('rounded-md');
      expect(textarea).toHaveClass('border-2');
      expect(textarea).toHaveClass('border-neo-border');
    });

    it('applies neo-brutalist shadow', () => {
      const { container } = render(<Textarea />);
      const textarea = container.querySelector('textarea');
      
      expect(textarea).toHaveClass('shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]');
    });

    it('applies focus styles', () => {
      const { container } = render(<Textarea />);
      const textarea = container.querySelector('textarea');
      
      expect(textarea).toHaveClass('focus-visible:outline-none');
      expect(textarea).toHaveClass('focus-visible:ring-ring');
      expect(textarea).toHaveClass('focus-visible:ring-offset-2');
    });

    it('applies disabled styles', () => {
      const { container } = render(<Textarea />);
      const textarea = container.querySelector('textarea');
      
      expect(textarea).toHaveClass('disabled:cursor-not-allowed');
      expect(textarea).toHaveClass('disabled:opacity-50');
    });

    it('applies placeholder styles', () => {
      const { container } = render(<Textarea />);
      const textarea = container.querySelector('textarea');
      
      expect(textarea).toHaveClass('placeholder:text-muted-foreground');
    });
  });

  describe('Props Forwarding', () => {
    it('accepts and applies placeholder', () => {
      render(<Textarea placeholder="Enter text here" />);
      const textarea = screen.getByPlaceholderText('Enter text here');
      expect(textarea).toBeInTheDocument();
    });

    it('accepts and applies value', () => {
      render(<Textarea value="Initial value" onChange={() => {}} />);
      const textarea = screen.getByDisplayValue('Initial value');
      expect(textarea).toBeInTheDocument();
    });

    it('accepts and applies defaultValue', () => {
      render(<Textarea defaultValue="Default text" />);
      const textarea = screen.getByDisplayValue('Default text');
      expect(textarea).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      const { container } = render(<Textarea disabled />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeDisabled();
    });

    it('handles readOnly state', () => {
      const { container } = render(<Textarea readOnly />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('readonly');
    });

    it('applies name attribute', () => {
      const { container } = render(<Textarea name="description" />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('name', 'description');
    });

    it('applies id attribute', () => {
      const { container } = render(<Textarea id="textarea-1" />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('id', 'textarea-1');
    });

    it('applies rows attribute', () => {
      const { container } = render(<Textarea rows={10} />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('rows', '10');
    });

    it('applies cols attribute', () => {
      const { container } = render(<Textarea cols={50} />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('cols', '50');
    });

    it('applies maxLength attribute', () => {
      const { container } = render(<Textarea maxLength={200} />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('maxLength', '200');
    });

    it('applies required attribute', () => {
      const { container } = render(<Textarea required />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeRequired();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<Textarea className="custom-class" />);
      const textarea = container.querySelector('textarea');
      
      expect(textarea).toHaveClass('custom-class');
      expect(textarea).toHaveClass('min-h-[80px]'); // Still has default classes
    });

    it('merges custom className with default classes', () => {
      const { container } = render(
        <Textarea className="h-32 border-blue-500" />
      );
      const textarea = container.querySelector('textarea');
      
      expect(textarea).toHaveClass('h-32');
      expect(textarea).toHaveClass('border-blue-500');
      expect(textarea).toHaveClass('rounded-md');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Textarea ref={ref as React.RefObject<HTMLTextAreaElement>} />);
      
      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('allows ref access to textarea methods', () => {
      const ref = { current: null as HTMLTextAreaElement | null };
      render(<Textarea ref={ref as React.RefObject<HTMLTextAreaElement>} />);
      
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
    });
  });

  describe('User Interactions', () => {
    it('handles text input', async () => {
      const onChange = jest.fn();
      render(<Textarea onChange={onChange} />);
      
      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Hello World');
      
      expect(onChange).toHaveBeenCalled();
      expect(textarea).toHaveValue('Hello World');
    });

    it('handles onChange events', async () => {
      const onChange = jest.fn();
      render(<Textarea onChange={onChange} />);
      
      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Test');
      
      expect(onChange).toHaveBeenCalledTimes(4); // Once per character
    });

    it('does not allow input when disabled', async () => {
      const onChange = jest.fn();
      render(<Textarea disabled onChange={onChange} />);
      
      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Test');
      
      expect(textarea).toHaveValue('');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not allow input when readOnly', async () => {
      const onChange = jest.fn();
      render(<Textarea readOnly value="Read only" onChange={onChange} />);
      
      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Test');
      
      expect(textarea).toHaveValue('Read only');
    });
  });

  describe('Accessibility', () => {
    it('has proper role', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Textarea aria-label="Comment field" />);
      const textarea = screen.getByLabelText('Comment field');
      expect(textarea).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Textarea aria-describedby="help-text" />
          <span id="help-text">Helper text</span>
        </>
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('supports aria-invalid', () => {
      const { container } = render(<Textarea aria-invalid={true} />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Form Integration', () => {
    it('works with form submission', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Textarea name="message" defaultValue="Form text" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const button = screen.getByRole('button');
      button.click();
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('validates with required attribute', () => {
      const { container } = render(<Textarea required />);
      const textarea = container.querySelector('textarea');
      
      expect(textarea?.validity.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty value', () => {
      render(<Textarea value="" onChange={() => {}} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('handles multiline text', async () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      
      await userEvent.type(textarea, 'Line 1{enter}Line 2{enter}Line 3');
      
      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
    });

    it('respects maxLength constraint', async () => {
      render(<Textarea maxLength={5} />);
      const textarea = screen.getByRole('textbox');
      
      await userEvent.type(textarea, '1234567890');
      
      expect(textarea).toHaveValue('12345');
    });
  });
});
