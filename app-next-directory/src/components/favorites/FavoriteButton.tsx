'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { NeoButton } from '@/components/ui/neo-button';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  // Accepts either listingId (legacy) or slug (preferred) - one is required
  listingId?: string;
  slug?: string;
  listingTitle?: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  // Optional controlled favorited state (useful for parent components/tests)
  isFavorited?: boolean;
  // Optional controlled initial favorited state (useful for parent components/tests)
  initialIsFavorited?: boolean;
  // Optional external toggle handler (parent can handle the network request)
  onToggle?: () => Promise<void> | void;
  // Enable optimistic updates (defaults to true)
  optimistic?: boolean;
}

export function FavoriteButton({
  listingId,
  slug,
  listingTitle,
  className = '',
  showText = false,
  size = 'md',
  isFavorited,
  initialIsFavorited,
  onToggle,
  optimistic = true,
  ...rest
}: FavoriteButtonProps & Record<string, unknown>) {
  const { data: session } = useSession();
  const [isFavoritedState, setIsFavoritedState] = useState<boolean>(initialIsFavorited ?? false);

  // Use controlled isFavorited prop when provided, otherwise use internal state
  const isFavoritedValue = isFavorited !== undefined ? isFavorited : isFavoritedState;

  // Determine the actual slug to use (prefer slug prop, fallback to listingId for backward compatibility)
  const actualSlug = slug || listingId;
  
  if (!actualSlug) {
    throw new Error('FavoriteButton requires either slug or listingId prop');
  }

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

      if (!session?.user?.id || !actualSlug) {
        setIsCheckingStatus(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/user/favorites/${actualSlug}`);
        if (response.ok) {
          const data = await response.json();
          setIsFavoritedState(data.favorited ?? false);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFavoriteStatus();
  }, [session, actualSlug, initialIsFavorited]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation();
    
    if (!session) {
      const callbackUrl =
        typeof window !== 'undefined' && typeof window.location?.href === 'string' && window.location.href.length > 0
          ? window.location.href
          : '/';
      void signIn(undefined, { callbackUrl });
      return;
    }

    if (!actualSlug) return;

    // If a parent provided an onToggle handler, delegate the network action to it
    if (typeof onToggle === 'function') {
      const previousState = isFavoritedState;
      
      // Optimistic update: toggle immediately if optimistic is enabled
      if (optimistic) {
        setIsFavoritedState(!isFavoritedState);
      }
      
      setIsLoading(true);
      try {
        await onToggle();
        // Parent is expected to update the prop 'isFavorited' which will
        // be picked up by the effect that watches `initialIsFavorited`.
      } catch (error) {
        // Revert optimistic update on error
        if (optimistic) {
          setIsFavoritedState(previousState);
        }
        console.error('Error in parent onToggle handler:', error);
        alert('An error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const previousState = isFavoritedState;
    
    // Optimistic update: toggle immediately if optimistic is enabled
    if (optimistic) {
      setIsFavoritedState(!isFavoritedState);
    }
    
    setIsLoading(true);

    try {
      if (previousState) {
        // Remove from favorites
        const response = await fetch('/api/user/favorites', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug: actualSlug }),
        });

        if (!response.ok) {
          throw new Error('Failed to remove favorite');
        }
        
        // Only update state if not using optimistic updates
        if (!optimistic) {
          setIsFavoritedState(false);
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug: actualSlug }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add favorite');
        }
        
        // Only update state if not using optimistic updates
        if (!optimistic) {
          setIsFavoritedState(true);
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      if (optimistic) {
        setIsFavoritedState(previousState);
      }
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
        aria-label="Checking favorite status"
        {...rest}
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
  className={`transition-all duration-200 hover:scale-105 ${isFavoritedValue ? 'favorited' : ''} ${className}`}
      title={isFavoritedValue ? `Remove "${listingTitle || 'listing'}" from favorites` : `Add "${listingTitle || 'listing'}" to favorites`}
      aria-label={isFavoritedValue ? 'Remove from favorites' : 'Add to favorites'}
      {...rest}
    >
      <Heart
        className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} transition-colors ${
          isFavoritedValue
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-500'
        } ${isLoading ? 'animate-pulse' : ''}`}
      />
      {showText && (
        <span className="ml-1 text-sm">
          {isLoading
            ? '...'
            : isFavoritedValue
              ? 'Saved'
              : 'Save'
          }
        </span>
      )}
    </NeoButton>
  );
}
