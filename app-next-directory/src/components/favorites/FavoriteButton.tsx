'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  listingId: string;
  listingTitle?: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({ 
  listingId, 
  listingTitle,
  className = '',
  showText = false,
  size = 'md'
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check if listing is already favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!session?.user?.id || !listingId) return;
      
      try {
        const response = await fetch('/api/user/favorites');
        if (response.ok) {
          const data = await response.json();
          const isFav = data.data?.some((fav: unknown) => fav.listingId === listingId);
          setIsFavorited(isFav || false);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFavoriteStatus();
  }, [session, listingId]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation();
    
    if (!session) {
      // TODO: Could show a sign-in modal or redirect to sign-in
      alert('Please sign in to save favorites');
      return;
    }

    if (!listingId) return;

    setIsLoading(true);

    try {
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/user/favorites/${listingId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFavorited(false);
        } else {
          throw new Error('Failed to remove favorite');
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listingId }),
        });

        if (response.ok) {
          setIsFavorited(true);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add favorite');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // TODO: Could show a toast notification
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'default'}
        className={`${className} animate-pulse`}
        disabled
        data-testid="favorite-button"
      >
        <Heart className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />
        {showText && <span className="ml-1">...</span>}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`transition-all duration-200 hover:scale-105 ${isFavorited ? 'favorited' : ''} ${className}`}
      title={isFavorited ? `Remove "${listingTitle || 'listing'}" from favorites` : `Add "${listingTitle || 'listing'}" to favorites`}
      data-testid="favorite-button"
    >
      <Heart
        className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} transition-colors ${
          isFavorited 
            ? 'fill-red-500 text-red-500' 
            : 'text-gray-400 hover:text-red-500'
        } ${isLoading ? 'animate-pulse' : ''}`}
      />
      {showText && (
        <span className="ml-1 text-sm">
          {isLoading 
            ? '...' 
            : isFavorited 
              ? 'Saved' 
              : 'Save'
          }
        </span>
      )}
    </Button>
  );
}