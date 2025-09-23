import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 20, 
  interactive = false, 
  onRatingChange,
  className 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (interactive) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div 
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxRating }, (_, index) => {
        const starRating = index + 1;
        const isFilled = starRating <= (hoverRating || rating);

        const star = (
          <Star
            size={size}
            className={cn(
              "transition-colors duration-200",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              isFilled
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        );

        if (!interactive) {
          return (
            <span key={index} className="inline-flex items-center" aria-hidden>
              {star}
            </span>
          );
        }

        return (
          <button
            key={index}
            type="button"
            data-testid={`rating-star-${starRating}`}
            aria-label={`Set rating to ${starRating} star${starRating === 1 ? '' : 's'}`}
            className={cn(
              "m-0 border-none bg-transparent p-0 text-inherit",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neo-primary/40"
            )}
            onClick={() => handleStarClick(starRating)}
            onMouseEnter={() => handleStarHover(starRating)}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}