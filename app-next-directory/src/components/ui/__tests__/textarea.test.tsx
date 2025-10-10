import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  it('applies focus styles', () => {
    const { container } = render(<Textarea />);
    const textarea = container.querySelector('textarea')!;
    const classes = new Set((textarea.getAttribute('class') || '').split(/\s+/));

    const hasEither = (a: string, b: string) => classes.has(a) || classes.has(b);

    expect(hasEither('focus-visible:outline-none', 'focus:outline-none')).toBe(true);
    expect(hasEither('focus-visible:ring-2', 'focus:ring-2')).toBe(true);
    expect(hasEither('focus-visible:ring-ring', 'focus:ring-ring')).toBe(true);
    expect(hasEither('focus-visible:ring-offset-2', 'focus:ring-offset-2')).toBe(true);
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('allows ref access to textarea methods', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    if (ref.current) {
      expect(typeof ref.current.focus).toBe('function');
      expect(typeof ref.current.blur).toBe('function');
    }
  });
});