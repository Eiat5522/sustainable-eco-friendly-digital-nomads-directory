"use client";

import { useEffect, useRef } from 'react';
import { type Listing } from '@/types/listings';
// Import Leaflet dynamically inside useEffect to avoid SSR issues
import 'leaflet/dist/leaflet.css';
import { createCustomMarker, createPopupContent } from './CustomMarker';

// Defining window interface for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

interface MapProps {
  listings: Listing[];
  center?: [number, number];
  zoom?: number;
}

export default function Map({ listings, center = [13.7563, 100.5018], zoom = 11 }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Dynamically import Leaflet only on the client side
    import('leaflet').then(L => {
      // Make L available globally if needed
      window.L = L;
      
      // Initialize map if not already initialized
      if (!mapRef.current) {
        mapRef.current = L.map('map', {
        zoomControl: true,
        scrollWheelZoom: true,
        maxZoom: 19
      }).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.clearLayers();
    }

    // Add markers for listings
    listings.forEach(listing => {
      if (listing.coordinates.latitude && listing.coordinates.longitude) {
        const marker = L.marker(
          [listing.coordinates.latitude, listing.coordinates.longitude],
          { icon: createCustomMarker(listing) }
        ).bindPopup(createPopupContent(listing), {
          maxWidth: 300,
          className: 'rounded-lg shadow-lg'
        });

        markersRef.current?.addLayer(marker);
      }
    });

    // Fit bounds to show all markers with padding
    const markers = markersRef.current?.getLayers() as L.Marker[];
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      const bounds = group.getBounds();
      const maxZoom = 15; // Limit max zoom when fitting bounds

      mapRef.current?.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom,
        animate: true,
        duration: 0.5
      });
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [listings, center, zoom]);

  return (
    <div className="relative w-full">
      <div id="map" className="w-full h-[600px] rounded-lg shadow-lg" />
      {/* SEO-friendly text (hidden) */}
      <div className="sr-only">
        <h2>Interactive Map of Sustainable Locations</h2>
        <p>
          Explore {listings.length} sustainable locations across Thailand including 
          eco-friendly coworking spaces, cafes, and accommodations. Click on markers 
          to view details about each location.
        </p>
      </div>
    </div>
  );
}
