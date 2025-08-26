'use client';

import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveMapProps {
  location?: { lat: number; lng: number };
  address?: string;
  name: string;
  className?: string;
}

export function InteractiveMap({ location, address, name, className }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!location || !mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      try {
        const L = await import('leaflet');
        
        // Import Leaflet CSS
        if (typeof window !== 'undefined') {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Initialize map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const map = L.map(mapRef.current).setView([location.lat, location.lng], 15);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add marker
        const customIcon = L.divIcon({
          html: `<div class="w-8 h-8 bg-neo-primary rounded-full flex items-center justify-center text-white shadow-lg">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                   </svg>
                 </div>`,
          className: 'custom-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        L.marker([location.lat, location.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`<strong>${name}</strong><br/>${address || 'Location'}`);

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Failed to load map:', error);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location, address, name]);

  // Fallback when no location is provided
  if (!location) {
    return (
      <div className={cn("h-64 bg-gray-100 rounded-lg flex items-center justify-center", className)}>
        <div className="text-center text-gray-500">
          <MapPin size={48} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Location not available</p>
          {address && (
            <p className="text-xs mt-1 max-w-xs">{address}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-64 rounded-lg overflow-hidden border-2 border-neo-border", className)}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}