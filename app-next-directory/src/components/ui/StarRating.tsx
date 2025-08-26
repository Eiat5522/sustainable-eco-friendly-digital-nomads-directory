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
        
        return (
          <Star
            key={index}
            size={size}
            className={cn(
              "transition-colors duration-200",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              isFilled 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            )}
            onClick={() => handleStarClick(starRating)}
            onMouseEnter={() => handleStarHover(starRating)}
          />
        );
      })}
    </div>
  );
}