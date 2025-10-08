import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  it('applies focus-visible styles on keyboard focus', async () => {
    render(
      <div>
        <button>Focusable before</button>
        <Textarea data-testid="textarea" />
      </div>
    );

    const textarea = screen.getByTestId('textarea');

    // Simulate keyboard navigation to trigger focus-visible
    await userEvent.tab(); // Focus the button
    await userEvent.tab(); // Focus the textarea

    expect(textarea).toHaveClass('focus-visible:outline-none');
    expect(textarea).toHaveClass('focus-visible:ring-ring');
    expect(textarea).toHaveClass('focus-visible:ring-offset-2');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});