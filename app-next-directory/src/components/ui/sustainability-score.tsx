"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface SustainabilityScoreProps {
  score: number; // Score from 1-5
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  variant?: 'leaf' | 'circle';
}

export function SustainabilityScore({
  score,
  size = 'md',
  className = '',
  showLabel = true,
  variant = 'leaf'
}: SustainabilityScoreProps) {
  // Validate score range
  const validScore = Math.max(1, Math.min(5, score));
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1',
    lg: 'text-lg gap-1.5'
  };

  // Get size for icons
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Get label based on score
  const getLabel = () => {
    if (validScore >= 4.5) return 'Outstanding';
    if (validScore >= 4) return 'Excellent';
    if (validScore >= 3) return 'Very Good';
    if (validScore >= 2) return 'Good';
    return 'Basic';
  };

  // Get color based on score
  const getColor = () => {
    if (validScore >= 4.5) return 'text-green-600 dark:text-green-400';
    if (validScore >= 4) return 'text-green-500';
    if (validScore >= 3) return 'text-lime-500';
    if (validScore >= 2) return 'text-amber-500';
    return 'text-gray-400';
  };

  // Render leaf icons
  const renderLeafIcons = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg 
        key={i} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={i < validScore ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={i < validScore ? "0" : "1.5"}
        className={cn(iconSize[size], i < validScore ? getColor() : 'text-gray-300')}
        aria-hidden="true"
      >
        <path d="M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-3.97 3.97a.75.75 0 1 1-1.06-1.06l3.97-3.97h-2.69a.75.75 0 0 1-.75-.75Zm-12 0A.75.75 0 0 1 3.75 3h4.5a.75.75 0 0 1 0 1.5H5.56l3.97 3.97a.75.75 0 0 1-1.06 1.06L4.5 5.56v2.69a.75.75 0 0 1-1.5 0v-4.5Zm11.47 11.78a.75.75 0 1 1 1.06-1.06l3.97 3.97v-2.69a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1 0-1.5h2.69l-3.97-3.97Zm-4.94-1.06a.75.75 0 0 1 0 1.06L5.56 19.5h2.69a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 1 1.5 0v2.69l3.97-3.97a.75.75 0 0 1 1.06 0Z" />
        <path d="M9.97 4.97a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H3a.75.75 0 0 1 0-1.5h10.19L9.97 6.03a.75.75 0 0 1 0-1.06Z" />
      </svg>
    ));
  };

  // Render circle icons
  const renderCircleIcons = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg 
        key={i} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24"
        fill={i < validScore ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={i < validScore ? "0" : "1.5"}
        className={cn(iconSize[size], i < validScore ? getColor() : 'text-gray-300')}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
      </svg>
    ));
  };

  return (
    <div className={cn('flex flex-col items-start', className)}>
      <div className={cn('flex items-center', sizeClasses[size])}>
        {variant === 'leaf' ? renderLeafIcons() : renderCircleIcons()}
      </div>
      {showLabel && (
        <span className={cn('text-xs mt-1 font-medium', getColor())}>
          {getLabel()} Eco-Rating
        </span>
      )}
    </div>
  );
}
