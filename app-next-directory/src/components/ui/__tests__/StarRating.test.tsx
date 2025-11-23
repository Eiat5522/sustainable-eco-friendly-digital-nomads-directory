import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from '../StarRating';

describe('StarRating', () => {
  describe('Static Rating Display', () => {
    it('renders correct number of stars based on rating', () => {
      const { container } = render(<StarRating rating={3} maxRating={5} />);
      const stars = container.querySelectorAll('svg');
      expect(stars).toHaveLength(5);
    });

    it('fills correct number of stars based on rating', () => {
      const { container } = render(<StarRating rating={3} maxRating={5} />);
      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(3);
    });

    it('renders with default maxRating of 5', () => {
      const { container } = render(<StarRating rating={4} />);
      const stars = container.querySelectorAll('svg');
      expect(stars).toHaveLength(5);
    });

    it('renders with custom maxRating', () => {
      const { container } = render(<StarRating rating={4} maxRating={10} />);
      const stars = container.querySelectorAll('svg');
      expect(stars).toHaveLength(10);
    });

    it('applies custom className', () => {
      const { container } = render(<StarRating rating={3} className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('renders with custom size', () => {
      const { container } = render(<StarRating rating={3} size={32} />);
      const stars = container.querySelectorAll('svg');
      stars.forEach(star => {
        expect(star).toHaveAttribute('width', '32');
        expect(star).toHaveAttribute('height', '32');
      });
    });

    it('handles zero rating', () => {
      const { container } = render(<StarRating rating={0} />);
      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(0);
    });

    it('handles full rating', () => {
      const { container } = render(<StarRating rating={5} maxRating={5} />);
      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(5);
    });
  });

  describe('Interactive Rating', () => {
    it('renders buttons when interactive is true', () => {
      render(<StarRating rating={3} interactive={true} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('calls onRatingChange when star is clicked', async () => {
      const onRatingChange = jest.fn();
      render(<StarRating rating={2} interactive={true} onRatingChange={onRatingChange} />);

      const fourthStar = screen.getByTestId('rating-star-4');
      await userEvent.click(fourthStar);

      expect(onRatingChange).toHaveBeenCalledWith(4);
      expect(onRatingChange).toHaveBeenCalledTimes(1);
    });

    it('does not call onRatingChange when not interactive', async () => {
      const onRatingChange = jest.fn();
      render(<StarRating rating={2} interactive={false} onRatingChange={onRatingChange} />);

      const { container } = render(<StarRating rating={2} interactive={false} />);
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(0);
    });

    it('updates hover state on mouse enter', async () => {
      const { container } = render(<StarRating rating={2} interactive={true} />);

      const thirdStar = screen.getByTestId('rating-star-3');
      fireEvent.mouseEnter(thirdStar);

      // After hover, 3 stars should be filled
      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars.length).toBeGreaterThanOrEqual(3);
    });

    it('resets hover state on mouse leave', async () => {
      const { container } = render(<StarRating rating={2} interactive={true} />);

      const wrapper = container.firstChild as HTMLElement;
      const fourthStar = screen.getByTestId('rating-star-4');

      fireEvent.mouseEnter(fourthStar);
      fireEvent.mouseLeave(wrapper);

      // After mouse leave, only 2 stars (the rating) should be filled
      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(2);
    });

    it('has proper aria-label for each star button', () => {
      render(<StarRating rating={3} interactive={true} />);

      expect(screen.getByLabelText('Set rating to 1 star')).toBeInTheDocument();
      expect(screen.getByLabelText('Set rating to 2 stars')).toBeInTheDocument();
      expect(screen.getByLabelText('Set rating to 3 stars')).toBeInTheDocument();
      expect(screen.getByLabelText('Set rating to 5 stars')).toBeInTheDocument();
    });

    it('handles multiple clicks correctly', async () => {
      const onRatingChange = jest.fn();
      render(<StarRating rating={2} interactive={true} onRatingChange={onRatingChange} />);

      const secondStar = screen.getByTestId('rating-star-2');
      const fourthStar = screen.getByTestId('rating-star-4');

      await userEvent.click(secondStar);
      await userEvent.click(fourthStar);

      expect(onRatingChange).toHaveBeenCalledTimes(2);
      expect(onRatingChange).toHaveBeenNthCalledWith(1, 2);
      expect(onRatingChange).toHaveBeenNthCalledWith(2, 4);
    });

    it('does not call onRatingChange when interactive but callback not provided', async () => {
      render(<StarRating rating={2} interactive={true} />);

      const thirdStar = screen.getByTestId('rating-star-3');
      await userEvent.click(thirdStar);

      // Should not throw error, just do nothing
      expect(screen.getByTestId('rating-star-3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles on interactive stars', () => {
      render(<StarRating rating={3} interactive={true} />);

      const firstButton = screen.getByTestId('rating-star-1');
      expect(firstButton).toHaveClass('focus:outline-none');
      expect(firstButton).toHaveClass('focus-visible:ring-2');
    });

    it('renders static stars with aria-hidden on spans', () => {
      const { container } = render(<StarRating rating={3} interactive={false} />);

      const spans = container.querySelectorAll('span[aria-hidden]');
      expect(spans).toHaveLength(5);
    });
  });
});
