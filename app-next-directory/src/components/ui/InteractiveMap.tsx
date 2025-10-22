'use client';

import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
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
  const [tileLoadFailed, setTileLoadFailed] = useState(false);

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

  useEffect(() => {
    if (!location || !mapRef.current) {
      return;
    }

    let tileLayer: Leaflet.TileLayer | null = null;
    let handleTileLoad: (() => void) | null = null;
    let handleTileError: (() => void) | null = null;
    let isMounted = true;

    const initMap = async () => {
      try {
        if (!LRef.current) {
          const mod = (await import('leaflet')) as typeof import('leaflet') & { default?: typeof import('leaflet') };
          LRef.current = mod.default ?? mod;
        }

        const L = LRef.current!;
        const container = mapRef.current;
        if (!container || !isMounted) {
          return;
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(container).setView([location.lat, location.lng], 15);
        mapInstanceRef.current = map;

        const tileUrl = process.env.NEXT_PUBLIC_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        handleTileLoad = () => {
          if (!isMounted) return;
          setTileLoadFailed(false);
          requestAnimationFrame(() => {
            map.invalidateSize();
          });
        };

        handleTileError = (e: Leaflet.TileErrorEvent) => {
          if (!isMounted) return;
          setTileLoadFailed(true);
          if (process.env.NODE_ENV !== 'production') {
            const detail =
              (typeof e.error?.message === 'string' && e.error.message) ||
              (typeof e.error?.code === 'string' && e.error.code) ||
              (typeof e.error === 'string' && e.error) ||
              (e.error instanceof Error ? e.error.message : undefined);
            const tileSrc =
              typeof (e.tile as HTMLImageElement | undefined)?.src === 'string'
                ? (e.tile as HTMLImageElement).src
                : undefined;
            console.warn('[map] Leaflet tile error (non-fatal)', detail ?? tileSrc ?? 'unknown');
          }
        };

        tileLayer = L.tileLayer(tileUrl, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 1,
          subdomains: ['a', 'b', 'c'],
          crossOrigin: true,
        });

        tileLayer.on('load', handleTileLoad);
        tileLayer.on('tileerror', handleTileError);
        tileLayer.addTo(map);

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

        const marker = L.marker([location.lat, location.lng], { icon: createCustomMarkerIcon(L) }).addTo(map);
        marker.bindPopup(popupContent);
        markerRef.current = marker;

        map.whenReady(() => {
          if (!isMounted) return;
          requestAnimationFrame(() => {
            map.invalidateSize();
          });
        });
      } catch (error) {
        if (isMounted) {
          setTileLoadFailed(true);
        }
        console.error('Failed to load map:', error);
      }
    };

    setTileLoadFailed(false);
    initMap();

    return () => {
      isMounted = false;
      if (tileLayer) {
        if (handleTileLoad) {
          tileLayer.off('load', handleTileLoad);
        }
        if (handleTileError) {
          tileLayer.off('tileerror', handleTileError);
        }
        tileLayer.remove();
        tileLayer = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, [location?.lat, location?.lng]);

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

  if (!location) {
    return (
      <div className={cn('h-64 bg-gray-100 rounded-lg flex items-center justify-center', className)}>
        <div className="text-center text-gray-500">
          <MapPin size={48} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Location not available</p>
          {address && <p className="text-xs mt-1 max-w-xs">{address}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-64 rounded-lg overflow-hidden border-2 border-neo-border', className)}>
      <div ref={mapRef} className="relative z-[10000] w-full h-full">
        {tileLoadFailed && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-gray-100/95 px-6 text-center text-xs text-gray-600">
            <p className="font-medium text-gray-700">Map tiles are unavailable right now.</p>
            <p>Please check your connection or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
