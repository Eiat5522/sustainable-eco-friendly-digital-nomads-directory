'use client';

import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type * as Leaflet from 'leaflet';

interface InteractiveMapProps {
  readonly location?: Readonly<{ lat: number; lng: number }>;
  readonly address?: string;
  readonly name: string;
  readonly className?: string;
}

export function InteractiveMap({ location, address, name, className }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);


  useEffect(() => {
    console.log('useEffect called');
    if (!location || !mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      try {
        // Support both ESM default and namespace exports
        if (!LRef.current) {
          const mod = (await import('leaflet')) as typeof import('leaflet') & { default?: typeof import('leaflet') };
          LRef.current = mod.default ?? mod;
        }
        const L = LRef.current!;

        // Initialize map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

  const container = mapRef.current as HTMLElement;
  const map = L.map(container).setView([location.lat, location.lng], 15);

        // Add tile layer with proper options
        const tileUrl = process.env.NEXT_PUBLIC_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        console.log('Tile URL:', tileUrl);
        L.tileLayer(tileUrl, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 1,
          subdomains: ['a', 'b', 'c']
        }).addTo(map);

    const createCustomMarkerIcon = (L: typeof Leaflet) =>
      L.divIcon({
        html: `<div class="w-8 h-8 bg-neo-primary rounded-full flex items-center justify-center text-white shadow-lg">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                 </svg>
               </div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }) as Leaflet.Icon;

        const customIcon = createCustomMarkerIcon(L);
        const popupContent = document.createElement('div');
        const titleEl = document.createElement('strong');
        titleEl.textContent = name;
        popupContent.appendChild(titleEl);
        if (address) {
          popupContent.appendChild(document.createElement('br'));
          const addrEl = document.createElement('span');
          addrEl.textContent = address;
          popupContent.appendChild(addrEl);
        }
        const marker = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent);
        markerRef.current = marker;
        mapInstanceRef.current = map;

        map.whenReady(() => {
          map.invalidateSize();
        });
        
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
      markerRef.current = null;
    };
  }, [location?.lat, location?.lng])

  // Update popup content if name/address change without relocating
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const popupContent = document.createElement('div');
    const titleEl = document.createElement('strong');
    titleEl.textContent = name;
    popupContent.appendChild(titleEl);
    if (address) {
      popupContent.appendChild(document.createElement('br'));
      const addrEl = document.createElement('span');
      addrEl.textContent = address;
      popupContent.appendChild(addrEl);
    }

    const popup = marker.getPopup?.();
    if (popup) {
      popup.setContent(popupContent);
    } else {
      marker.bindPopup(popupContent);
    }
  }, [name, address]);

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
