import { City, Listing } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Fix Leaflet marker icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface CityMapProps {
  city: City;
  listings?: Listing[];
}

const CityMap: React.FC<CityMapProps> = ({ city, listings = [] }) => {
  const mapRef = useRef<L.Map | null>(null);

  const position: [number, number] = [
    city.coordinates?.latitude || 0,
    city.coordinates?.longitude || 0
  ];

  useEffect(() => {
    // Fix for Leaflet icon in Next.js
    L.Marker.prototype.options.icon = defaultIcon;
  }, []);

  // Handle case where there are no coordinates
  if (!city.coordinates?.latitude || !city.coordinates?.longitude) {
    return (
      <div className="bg-gray-100 rounded-lg h-full w-full flex items-center justify-center">
        <p className="text-gray-500">Map coordinates not available for this city</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      whenCreated={(map) => {
        mapRef.current = map;
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* City center marker */}
      <Marker position={position}>
        <Popup>
          <div>
            <h3 className="font-semibold">{city.name}</h3>
            <p className="text-sm text-gray-600">{city.country}</p>
          </div>
        </Popup>
      </Marker>

      {/* Listing markers */}
      {listings.map((listing) => {
        if (listing.coordinates?.latitude && listing.coordinates?.longitude) {
          const listingPosition: [number, number] = [
            listing.coordinates.latitude,
            listing.coordinates.longitude
          ];

          return (
            <Marker
              key={listing.id}
              position={listingPosition}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `<div class="bg-green-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-md">🏠</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 24],
              })}
            >
              <Popup>
                <div className="w-48">
                  {listing.imageUrl && (
                    <div className="w-full h-24 relative mb-2">
                      <img
                        src={listing.imageUrl}
                        alt={listing.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-sm">{listing.name}</h3>
                  <p className="text-xs text-gray-600">{listing.category}</p>
                  <button className="text-xs text-green-600 mt-1 hover:underline">
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
    </MapContainer>
  );
};

export default CityMap;
