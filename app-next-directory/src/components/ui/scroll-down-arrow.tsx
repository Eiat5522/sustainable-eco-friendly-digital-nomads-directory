'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Scroll Down Arrow - Modern landing page indicator
 * - Transparent by default (opacity: 0)
 * - Appears on hover or when user scrolls down
 * - Centered at bottom of hero section
 * - Smooth animation transitions
 */
export function ScrollDownArrow() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show arrow when user scrolls down even a little bit
      setIsVisible(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    // Scroll to the next section smoothly
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-300 ease-in-out cursor-pointer bg-transparent border-none p-2 group"
      style={{
        opacity: isVisible || isHovered ? 1 : 0,
      }}
      aria-label="Scroll down to view more content"
      title="Scroll down"
    >
      <div className="flex flex-col items-center">
        <ChevronDown
          className="w-8 h-8 text-white animate-bounce group-hover:scale-110 transition-transform duration-200"
          strokeWidth={2.5}
        />
        <div className="mt-1 w-0.5 h-8 bg-white/50 group-hover:bg-white transition-colors duration-200" />
      </div>
    </button>
  );
}
