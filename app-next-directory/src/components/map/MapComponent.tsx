"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { type Listing } from '@/types/listings';
import '@/styles/map.css';

export interface MapComponentProps {
  listings: Listing[];
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
}

const DEFAULT_CENTER: L.LatLngTuple = [13.7563, 100.5018]; // Bangkok
const DEFAULT_ZOOM = 12;

const categoryIcons = {
  coworking: '🏢',
  cafe: '☕',
  accommodation: '🏠'
};

export default function MapComponent({ listings, onBoundsChange }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        layers: [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          })
        ]
      });

      // Create marker cluster group
      markersRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster) => {
          return L.divIcon({
            html: `<div class="cluster-icon">${cluster.getChildCount()}</div>`,
            className: 'custom-marker-cluster',
            iconSize: L.point(40, 40)
          });
        }
      });

      // Add the marker cluster group to the map
      mapRef.current.addLayer(markersRef.current);

      // Setup bounds change handler
      if (onBoundsChange) {
        mapRef.current.on('moveend', () => {
          onBoundsChange(mapRef.current!.getBounds());
        });
      }
    }

    // Update markers when listings change
    if (markersRef.current && mapRef.current) {
      markersRef.current.clearLayers();

      if (Array.isArray(listings)) {
        listings.forEach(listing => {
          const { latitude, longitude } = listing.coordinates || {};
          if (!latitude || !longitude) return;

          const marker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: `<div class="marker-icon">${categoryIcons[listing.category]}</div>`,
              className: 'custom-marker',
              iconSize: L.point(32, 32)
            })
          });

          marker.bindPopup(`
            <div class="marker-popup">
              <h3 class="font-semibold">${listing.name}</h3>
              <p class="text-sm text-gray-600">${listing.address_string}</p>
              <div class="mt-2">
                ${Array.isArray(listing.eco_focus_tags) ? listing.eco_focus_tags.map(tag => 
                  `<span class=\"inline-block px-2 py-1 mr-1 mb-1 text-xs bg-green-100 text-green-800 rounded-full\">${tag}</span>`
                ).join('') : ''}
              </div>
            </div>
          `);

          markersRef.current?.addLayer(marker);
        });
      }

      // If we have listings and this is the first time, fit bounds
      if (listings.length > 0 && !mapRef.current.getBounds().getNorthEast().equals(mapRef.current.getBounds().getSouthWest())) {
        const bounds = L.latLngBounds(listings
          .filter(l => l.coordinates.latitude && l.coordinates.longitude)
          .map(l => [l.coordinates.latitude!, l.coordinates.longitude!] as L.LatLngTuple));
        
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [listings, onBoundsChange]);

  return <div id="map" className="w-full h-full" />;
}
