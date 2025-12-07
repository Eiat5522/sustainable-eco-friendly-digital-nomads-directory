'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface LeafletMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: [number, number];
  radius?: number;
  className?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  onLocationSelect,
  initialPosition = [13.7563, 100.5018], // Default to Bangkok
  radius = 10,
  className = 'h-64 w-full rounded-lg',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(initialPosition, 11);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add initial marker
    const marker = L.marker(initialPosition, { draggable: true }).addTo(map);
    markerRef.current = marker;

    // Add radius circle
    const circle = L.circle(initialPosition, {
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.2,
      radius: radius * 1000, // Convert km to meters
    }).addTo(map);
    circleRef.current = circle;

    // Handle marker drag
    marker.on('dragend', function () {
      const position = marker.getLatLng();
      circle.setLatLng(position);
      onLocationSelect(position.lat, position.lng);
    });

    // Handle map clicks
    map.on('click', function (e) {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
      onLocationSelect(lat, lng);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, initialPosition, onLocationSelect]);

  // Update radius when it changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1000);
    }
  }, [radius]);

  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="h-full w-full rounded-lg" />
      <p className="mt-2 text-xs text-gray-500">
        Click on the map or drag the marker to select a location. The green circle shows your search
        radius.
      </p>
    </div>
  );
};

export default LeafletMap;
