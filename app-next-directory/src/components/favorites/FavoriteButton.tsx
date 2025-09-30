'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { NeoButton } from '@/components/ui/neo-button';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  listingId: string;
  listingTitle?: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  // Optional controlled initial favorited state (useful for parent components/tests)
  isFavorited?: boolean;
  // Optional external toggle handler (parent can handle the network request)
  onToggle?: () => Promise<void> | void;
}

export function FavoriteButton({ 
  listingId, 
  listingTitle,
  className = '',
  showText = false,
  size = 'md',
  isFavorited: initialIsFavorited
  onToggle,
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavoritedState, setIsFavoritedState] = useState<boolean>(initialIsFavorited ?? false);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check if listing is already favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      // If parent provided an initial favorited state, use it and skip the remote check
      if (typeof initialIsFavorited !== 'undefined') {
        setIsFavoritedState(Boolean(initialIsFavorited));
        setIsCheckingStatus(false);
        return;
      }

      if (!session?.user?.id || !listingId) {
        setIsCheckingStatus(false);
        return;
      }
      
      try {
        const response = await fetch('/api/user/favorites');
        if (response.ok) {
          const data = await response.json();
          const isFav = data.data?.some((fav: { listingId: string }) => fav.listingId === listingId) ?? false;
          setIsFavoritedState(isFav);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFavoriteStatus();
  }, [session, listingId, initialIsFavorited]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation();
    
    if (!session) {
      // TODO: Could show a sign-in modal or redirect to sign-in
      alert('Please sign in to save favorites');
      return;
    }

    if (!listingId) return;

    // If a parent provided an onToggle handler, delegate the network action to it
    if (typeof onToggle === 'function') {
      setIsLoading(true);
      try {
        await onToggle();
        // Parent is expected to update the prop 'isFavorited' which will
        // be picked up by the effect that watches `initialIsFavorited`.
      } catch (error) {
        console.error('Error in parent onToggle handler:', error);
        alert('An error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    try {
      if (isFavoritedState) {
        // Remove from favorites
        const response = await fetch(`/api/user/favorites/${listingId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFavoritedState(false);
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
          setIsFavoritedState(true);
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
      <NeoButton
        variant="secondary"
        size={size}
        className={`${className} animate-pulse`}
        disabled
        data-testid="favorite-button"
        aria-label="Checking favorite status"
      >
        <Heart className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />
        {showText && <span className="ml-1">...</span>}
      </NeoButton>
    );
  }

  return (
    <NeoButton
      variant="secondary"
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading}
  className={`transition-all duration-200 hover:scale-105 ${isFavoritedState ? 'favorited' : ''} ${className}`}
      title={isFavoritedState ? `Remove "${listingTitle || 'listing'}" from favorites` : `Add "${listingTitle || 'listing'}" to favorites`}
      aria-label={isFavoritedState ? 'Remove from favorites' : 'Add to favorites'}
      data-testid="favorite-button"
    >
      <Heart
        className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} transition-colors ${
          isFavoritedState 
            ? 'fill-red-500 text-red-500' 
            : 'text-gray-400 hover:text-red-500'
        } ${isLoading ? 'animate-pulse' : ''}`}
      />
      {showText && (
        <span className="ml-1 text-sm">
          {isLoading 
            ? '...' 
            : isFavoritedState 
              ? 'Saved' 
              : 'Save'
          }
        </span>
      )}
    </NeoButton>
  );
}