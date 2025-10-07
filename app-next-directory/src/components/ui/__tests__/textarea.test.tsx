import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  describe('Styling and CSS Classes', () => {
    it('should apply base CSS classes', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      
      expect(textarea).toHaveClass('flex');
      expect(textarea).toHaveClass('min-h-[80px]');
      expect(textarea).toHaveClass('w-full');
      expect(textarea).toHaveClass('rounded-md');
      expect(textarea).toHaveClass('border');
      expect(textarea).toHaveClass('border-input');
      expect(textarea).toHaveClass('bg-background');
      expect(textarea).toHaveClass('px-3');
      expect(textarea).toHaveClass('py-2');
      expect(textarea).toHaveClass('text-sm');
    });

    it('should apply focus styles', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      
      expect(textarea).toHaveClass('focus-visible:outline-none');
      expect(textarea).toHaveClass('focus-visible:ring-2');
      expect(textarea).toHaveClass('focus-visible:ring-ring');
      expect(textarea).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should apply disabled styles', () => {
      render(<Textarea data-testid="textarea" disabled />);
      const textarea = screen.getByTestId('textarea');
      
      expect(textarea).toHaveClass('disabled:cursor-not-allowed');
      expect(textarea).toHaveClass('disabled:opacity-50');
      expect(textarea).toBeDisabled();
    });

    it('should apply placeholder styles', () => {
      render(<Textarea data-testid="textarea" placeholder="Enter text" />);
      const textarea = screen.getByTestId('textarea');
      
      expect(textarea).toHaveClass('placeholder:text-muted-foreground');
      expect(textarea).toHaveAttribute('placeholder', 'Enter text');
    });

    it('should merge custom className with default classes', () => {
      render(<Textarea data-testid="textarea" className="custom-class" />);
      const textarea = screen.getByTestId('textarea');
      
      expect(textarea).toHaveClass('custom-class');
      expect(textarea).toHaveClass('flex');
      expect(textarea).toHaveClass('rounded-md');
    });
  });

  describe('Functionality', () => {
    it('should render with default props', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should handle user input', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      
      await user.type(textarea, 'Hello, World!');
      expect(textarea).toHaveValue('Hello, World!');
    });

    it('should handle onChange event', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Textarea data-testid="textarea" onChange={handleChange} />);
      const textarea = screen.getByTestId('textarea');
      
      await user.type(textarea, 'Test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should support ref forwarding', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('should respect rows attribute', () => {
      render(<Textarea data-testid="textarea" rows={5} />);
      const textarea = screen.getByTestId('textarea');
      
      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('should respect maxLength attribute', async () => {
      const user = userEvent.setup();
      render(<Textarea data-testid="textarea" maxLength={10} />);
      const textarea = screen.getByTestId('textarea');
      
      await user.type(textarea, 'This is a very long text');
      expect(textarea).toHaveValue('This is a ');
    });

    it('should support required attribute', () => {
      render(<Textarea data-testid="textarea" required />);
      const textarea = screen.getByTestId('textarea');
      
      expect(textarea).toBeRequired();
    });

    it('should support readOnly attribute', () => {
      render(<Textarea data-testid="textarea" readOnly value="Read only text" />);
      const textarea = screen.getByTestId('textarea');
      
      expect(textarea).toHaveAttribute('readonly');
      expect(textarea).toHaveValue('Read only text');
    });
  });
});
