"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
// @ts-ignore: No types for leaflet.markercluster, use any
type MarkerCluster = any;
// @ts-ignore: No types for leaflet.markercluster, use any
type MarkerClusterGroup = any;
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { AppListingDetail } from '@/types/appView';
import '@/styles/map.css';

export interface MapComponentProps {
  listings: AppListingDetail[];
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
}

const DEFAULT_CENTER: L.LatLngTuple = [13.7563, 100.5018]; // Bangkok
const DEFAULT_ZOOM = 12;

const typeIcons: Record<NonNullable<AppListingDetail['category']>, string> = {
  coworking: '🏢',
  cafe: '☕',
  accommodation: '🏠',
  restaurant: '🍽️',
  activities: '🤸',
};

export default function MapComponent({ listings, onBoundsChange }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<MarkerClusterGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Make sure we have a container element
    if (!containerRef.current) return;

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        layers: [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          })
        ]
      });

      // Create marker cluster group
      // @ts-ignore: markerClusterGroup is provided by leaflet.markercluster plugin
      markersRef.current = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: MarkerCluster) => {
          return L.divIcon({
            html: `<div class="cluster-icon">${cluster.getChildCount()}</div>`,
            className: 'custom-marker-cluster',
            iconSize: L.point(40, 40)
          });
        }
      });

      // Add the marker cluster group to the map
      if (markersRef.current) {
        mapRef.current.addLayer(markersRef.current);
      }

      // Setup bounds change handler
      if (onBoundsChange) {
        mapRef.current.on('moveend', () => {
          if (mapRef.current) {
            onBoundsChange(mapRef.current.getBounds());
          }
        });
      }
    }

    // Update markers when listings change
    if (markersRef.current && mapRef.current) {
      markersRef.current.clearLayers();

      if (Array.isArray(listings)) {
        const validListings = listings.filter(listing =>
          listing.location &&
          typeof listing.location.lat === 'number' &&
          typeof listing.location.lng === 'number'
        );

        validListings.forEach(listing => {
          const { lat, lng } = listing.location!;
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              html: `<div class="marker-icon">${listing.category ? typeIcons[listing.category as keyof typeof typeIcons] ?? '' : ''}</div>`,
              className: 'custom-marker',
              iconSize: L.point(32, 32)
            })
          });

          marker.bindPopup(`
            <div class="marker-popup">
              <h3 class="font-semibold">${listing.name}</h3>
              <p class="text-sm text-gray-600">${listing.address || 'No address available'}</p>
            </div>
          `);

          markersRef.current?.addLayer(marker);
        });

        // Fit bounds to show all markers if we have valid listings
        if (validListings.length > 0) {
          const bounds = L.latLngBounds(validListings.map(l => [l.location!.lat!, l.location!.lng!] as L.LatLngTuple));
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [20, 20] });
          }
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

  return <div ref={containerRef} className="w-full h-full" />;
}
