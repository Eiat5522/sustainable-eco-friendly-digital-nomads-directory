import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScrollDownArrow } from '../scroll-down-arrow';

describe('ScrollDownArrow', () => {
  beforeEach(() => {
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
  });

  it('is initially hidden', () => {
    render(<ScrollDownArrow />);
    const button = screen.getByLabelText('Scroll down to view more content');
    expect(button).toHaveStyle('opacity: 0');
  });

  it('becomes visible on scroll', () => {
    render(<ScrollDownArrow />);
    const button = screen.getByLabelText('Scroll down to view more content');
    fireEvent.scroll(window, { target: { scrollY: 100 } });
    expect(button).toHaveStyle('opacity: 1');
  });

  it('becomes visible on hover', () => {
    render(<ScrollDownArrow />);
    const button = screen.getByLabelText('Scroll down to view more content');
    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle('opacity: 1');
  });

  it('hides on mouse leave if not scrolled', () => {
    render(<ScrollDownArrow />);
    const button = screen.getByLabelText('Scroll down to view more content');
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    expect(button).toHaveStyle('opacity: 0');
  });

  it('calls window.scrollTo on click', () => {
    render(<ScrollDownArrow />);
    const button = screen.getByLabelText('Scroll down to view more content');
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  });
});
