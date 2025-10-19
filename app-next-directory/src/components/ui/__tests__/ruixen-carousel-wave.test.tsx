import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RuixenCarouselWave from '../ruixen-carousel-wave';

// Mock gsap
jest.mock('gsap', () => ({
  to: jest.fn(),
  set: jest.fn(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, priority, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} fill={fill?.toString()} priority={priority?.toString()} />;
  },
}));

describe('RuixenCarouselWave', () => {
  it('renders the carousel with the initial set of cards', () => {
    render(<RuixenCarouselWave />);
    expect(screen.getByText('Design Dashboards')).toBeInTheDocument();
    expect(screen.getByText('Marketing Sites')).toBeInTheDocument();
    expect(screen.getByText('AI SaaS Tools')).toBeInTheDocument();
  });

  it('shifts to the next card on next button click', () => {
    render(<RuixenCarouselWave />);
    const nextButton = screen.getByLabelText('Next');
    fireEvent.click(nextButton);
    expect(require('gsap').to).toHaveBeenCalled();
  });

  it('shifts to the previous card on prev button click', () => {
    render(<RuixenCarouselWave />);
    const prevButton = screen.getByLabelText('Previous');
    fireEvent.click(prevButton);
    expect(require('gsap').to).toHaveBeenCalled();
  });

  it('renders badges with correct colors', () => {
    render(<RuixenCarouselWave />);
    expect(screen.getByText('UI')).toHaveClass('bg-pink-600');
    expect(screen.getByText('New')).toHaveClass('bg-orange-500');
    expect(screen.getByText('AI')).toHaveClass('bg-indigo-600');
  });

  it('has links for each card', () => {
    render(<RuixenCarouselWave />);
    const links = screen.getAllByRole('link');
    // There are 5 cards, so there should be 5 links.
    expect(links.length).toBe(5);
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });
});