import { render, screen } from '@testing-library/react';
import { NoListingsFound } from '../NoListingsFound';

describe('NoListingsFound', () => {
  describe('Basic Rendering', () => {
    it('renders the component', () => {
      render(<NoListingsFound />);
      expect(screen.getByText('No listings found for this city yet.')).toBeInTheDocument();
    });

    it('renders the emoji icon', () => {
      render(<NoListingsFound />);
      const emoji = screen.getByText('🧐');
      expect(emoji).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders the main message', () => {
      render(<NoListingsFound />);
      expect(screen.getByText('No listings found for this city yet.')).toBeInTheDocument();
    });

    it('renders the helper text', () => {
      render(<NoListingsFound />);
      expect(screen.getByText('Try adjusting filters or check back later.')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies container styling', () => {
      render(<NoListingsFound />);
      const wrapper = screen.getByRole('status');

      expect(wrapper).toHaveClass('text-center');
      expect(wrapper).toHaveClass('py-12');
    });

    it('styles the emoji container', () => {
      render(<NoListingsFound />);
      const emojiContainer = screen.getByText('🧐').parentElement;

      expect(emojiContainer).toHaveClass('mx-auto');
      expect(emojiContainer).toHaveClass('mb-3');
      expect(emojiContainer).toHaveClass('h-12');
      expect(emojiContainer).toHaveClass('w-12');
      expect(emojiContainer).toHaveClass('bg-muted');
      expect(emojiContainer).toHaveClass('flex');
      expect(emojiContainer).toHaveClass('items-center');
      expect(emojiContainer).toHaveClass('justify-center');
      expect(emojiContainer).toHaveClass('shadow-inner');
    });

    it('applies body-lg class to main message', () => {
      render(<NoListingsFound />);
      const mainMessage = screen.getByText('No listings found for this city yet.');
      expect(mainMessage).toHaveClass('body-lg');
    });

    it('applies body-sm and text-neo-text-secondary to helper text', () => {
      render(<NoListingsFound />);
      const helperText = screen.getByText('Try adjusting filters or check back later.');

      expect(helperText).toHaveClass('body-sm');
      expect(helperText).toHaveClass('text-neo-text-secondary');
      expect(helperText).toHaveClass('mt-1');
    });
  });

  describe('Accessibility', () => {
    it('has role="status"', () => {
      render(<NoListingsFound />);
      const wrapper = screen.getByRole('status');
      expect(wrapper).toHaveAttribute('role', 'status');
    });

    it('has aria-live="polite"', () => {
      render(<NoListingsFound />);
      const wrapper = screen.getByRole('status');
      expect(wrapper).toHaveAttribute('aria-live', 'polite');
    });

    it('hides emoji from screen readers', () => {
      render(<NoListingsFound />);
      const emoji = screen.getByText('🧐');
      expect(emoji).toHaveAttribute('aria-hidden', 'true');
    });

    it('provides informative text for screen readers', () => {
      render(<NoListingsFound />);

      // Screen readers will read the text content
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveTextContent('No listings found for this city yet.');
      expect(statusElement).toHaveTextContent('Try adjusting filters or check back later.');
    });
  });

  describe('Structure', () => {
    it('wraps content in a div', () => {
      render(<NoListingsFound />);
      const wrapper = screen.getByRole('status');
      expect(wrapper.tagName).toBe('DIV');
    });

    it('has correct element hierarchy', () => {
      render(<NoListingsFound />);
      const wrapper = screen.getByRole('status');

      // Should contain emoji container
      const emojiContainer = wrapper.querySelector('.rounded-full');
      expect(wrapper).toContainElement(emojiContainer);

      // Should contain paragraphs
      const paragraphs = wrapper.querySelectorAll('p');
      expect(paragraphs).toHaveLength(2);
    });

    it('renders main message as paragraph', () => {
      render(<NoListingsFound />);
      const mainMessage = screen.getByText('No listings found for this city yet.');
      expect(mainMessage.tagName).toBe('P');
    });

    it('renders helper text as paragraph', () => {
      render(<NoListingsFound />);
      const helperText = screen.getByText('Try adjusting filters or check back later.');
      expect(helperText.tagName).toBe('P');
    });
  });

  describe('Visual Presentation', () => {
    it('centers all content', () => {
      render(<NoListingsFound />);
      const wrapper = screen.getByRole('status');
      expect(wrapper).toHaveClass('text-center');
    });

    it('provides adequate padding', () => {
      render(<NoListingsFound />);
      const wrapper = screen.getByRole('status');
      expect(wrapper).toHaveClass('py-12');
    });

    it('positions emoji above text', () => {
      render(<NoListingsFound />);
      const wrapper = screen.getByRole('status');
      const children = Array.from(wrapper.children);

      // First child should be emoji container
      expect(children[0]).toHaveClass('rounded-full');
      // Second child should be first paragraph
      expect(children[1].textContent).toContain('No listings found');
    });
  });

  describe('Consistency', () => {
    it('renders consistently across multiple renders', () => {
      const { rerender } = render(<NoListingsFound />);
      const firstRender = document.querySelector('[role="status"]')?.innerHTML;

      rerender(<NoListingsFound />);
      const secondRender = document.querySelector('[role="status"]')?.innerHTML;

      expect(firstRender).toBe(secondRender);
    });

    it('has no props but renders the same content', () => {
      const { container: container1 } = render(<NoListingsFound />);
      const { container: container2 } = render(<NoListingsFound />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });
  });
});
