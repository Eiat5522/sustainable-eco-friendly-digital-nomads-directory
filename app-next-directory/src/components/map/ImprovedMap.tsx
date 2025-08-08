"use client";

import { useEffect, useRef, useState } from 'react';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  listings?: Array<{
    coordinates: {
      latitude: number;
      longitude: number;
    };
    name: string;
    category: string;
  }>;
}

export default function Map({ listings = [], center = [13.7563, 100.5018], zoom = 13 }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Dynamically import Leaflet only on the client side
    const initMap = async () => {
      try {
        const L = await import('leaflet');
        
        // Fix for default markers in Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Initialize map
        mapInstanceRef.current = L.map(mapRef.current!).setView(center, zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstanceRef.current);

        // Add markers for listings
        if (listings.length > 0) {
          listings.forEach(listing => {
            if (listing.coordinates.latitude && listing.coordinates.longitude) {
              const marker = L.marker([listing.coordinates.latitude, listing.coordinates.longitude])
                .addTo(mapInstanceRef.current);
              
              marker.bindPopup(`
                <div>
                  <h3 style="margin: 0 0 8px 0; font-weight: bold;">${listing.name}</h3>
                  <p style="margin: 0; color: #666;">${listing.category}</p>
                </div>
              `);
            }
          });

          // Fit bounds to show all markers if multiple listings
          if (listings.length > 1) {
            const group = new L.FeatureGroup(
              listings
                .filter(l => l.coordinates.latitude && l.coordinates.longitude)
                .map(l => L.marker([l.coordinates.latitude, l.coordinates.longitude]))
            );
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
          }
        }
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    initMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, center, zoom, listings]);

  if (!isClient) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}