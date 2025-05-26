import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { AnyListing } from '@/types/listing'
import { motion } from 'framer-motion'

interface MapViewProps {
  listings: AnyListing[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (listing: AnyListing) => void
  className?: string
  isInteractive?: boolean
  showClusters?: boolean
  ecoView?: boolean // Shows eco-styled map
  showUserLocation?: boolean
}

// Custom icon configuration with eco-friendly styling
const createCustomIcon = (type: string, ecoRating?: number) => {
  const iconColors: { [key: string]: string } = {
    coworking: '#9333EA', // purple-600
    cafe: '#CA8A04',      // yellow-600
    accommodation: '#2563EB', // blue-600
    restaurant: '#DC2626', // red-600
    activities: '#16A34A', // green-600
  };
  
  const baseColor = iconColors[type] || '#22c55e'; // Default to green if type not found
  
  // Apply eco styling based on rating
  const borderColor = ecoRating && ecoRating > 80 ? '#22c55e' : 
                      ecoRating && ecoRating > 60 ? '#84cc16' : 
                      ecoRating && ecoRating > 40 ? '#eab308' : '#ffffff';
  
  const borderWidth = ecoRating && ecoRating > 80 ? 3 : 2;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        background-color: ${baseColor};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        box-shadow: 0 3px 6px rgba(0,0,0,0.2);
        border: ${borderWidth}px solid ${borderColor};
        transform-origin: center bottom;
        transition: transform 0.3s ease;
      "
      class="marker-icon"
      onmouseover="this.style.transform='scale(1.1)'"
      onmouseout="this.style.transform='scale(1)'"
      >
        ${type[0].toUpperCase()}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Custom cluster icon with eco-friendly styling
const createClusterIcon = (cluster: any, ecoView = false) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 40 : count < 50 ? 50 : 60;
  
  // In eco view, we add some leaf styling to clusters
  const leafAccent = ecoView ? `
    <svg viewBox="0 0 24 24" fill="#ffffff" style="position: absolute; top: -8px; right: -8px; width: 16px; height: 16px; opacity: 0.85;">
      <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
    </svg>
  ` : '';
  
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #22c55e, #10b981);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${count < 10 ? 16 : 14}px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.25);
        border: 2px solid rgba(255,255,255,0.8);
        position: relative;
      ">
        ${count}
        ${leafAccent}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

export function MapView({
  listings,
  center = [13.7563, 100.5018], // Bangkok, Thailand
  zoom = 11,
  onMarkerClick,
  className = '',
  isInteractive = true,
  showClusters = true,
  ecoView = true,
  showUserLocation = true,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    // Custom map style with eco-friendly colors
    const ecoTileLayer = ecoView ? 
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        className: 'eco-map-tiles',
      }) : 
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
    
    // Create the map instance
    const map = L.map(containerRef.current, {
      center,
      zoom,
      layers: [ecoTileLayer],
      zoomControl: isInteractive,
      attributionControl: true,
      scrollWheelZoom: isInteractive,
      dragging: isInteractive,
      tap: isInteractive,
    });
    
    // Apply eco filter to map if ecoView is enabled
    if (ecoView) {
      // Apply CSS filter to give the map a subtle eco feel
      const mapContainer = map.getContainer();
      mapContainer.style.filter = 'hue-rotate(10deg) saturate(1.1)';
    }
    
    // Add zoom controls at bottom right
    if (isInteractive) {
      L.control.zoom({
        position: 'bottomright',
      }).addTo(map);
    }
    
    // Initialize marker cluster group with custom styling
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: showClusters ? undefined : 1, // Disable clustering if not needed
      iconCreateFunction: (cluster) => createClusterIcon(cluster, ecoView),
    });
    
    clusterRef.current = clusterGroup;
    map.addLayer(clusterGroup);
    mapRef.current = map;
    setIsMapInitialized(true);
    
    // Get user's location if allowed
    if (showUserLocation && navigator.geolocation && isInteractive) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userLoc);
          
          // Add a special marker for user location
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                background-color: #3b82f6;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 8px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              "></div>
              <style>
                @keyframes pulse {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.3); opacity: 0.7; }
                  100% { transform: scale(1); opacity: 1; }
                }
              </style>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          
          L.marker(userLoc, { icon: userIcon }).addTo(map);
          
          // Don't center on user location automatically, just show where they are
        },
        (err) => {
          console.warn('Error getting user location:', err);
        }
      );
    }
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        clusterRef.current = null;
        markersRef.current = {};
      }
    };
  }, [center, zoom, isInteractive, ecoView, showUserLocation]);

  // Add, update, or remove markers when listings change
  useEffect(() => {
    if (!mapRef.current || !clusterRef.current || !isMapInitialized) return;
    
    // Track which markers need to be removed
    const newMarkerIds = new Set(listings.map(listing => listing._id));
    const existingMarkerIds = Object.keys(markersRef.current);
    
    // Remove markers that don't exist in the new listings
    existingMarkerIds.forEach(id => {
      if (!newMarkerIds.has(id) && markersRef.current[id]) {
        clusterRef.current!.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });
    
    // Add or update markers
    const bounds = L.latLngBounds([]);
    let hasValidCoordinates = false;
    
    listings.forEach(listing => {
      const { _id, location, type, name, ecoRating } = listing;
      
      if (!location?.coordinates || 
          !location.coordinates[0] || 
          !location.coordinates[1] ||
          isNaN(location.coordinates[0]) || 
          isNaN(location.coordinates[1])) {
        return; // Skip invalid coordinates
      }
      
      const position: [number, number] = [location.coordinates[0], location.coordinates[1]];
      bounds.extend(position);
      hasValidCoordinates = true;
      
      // Create or update marker
      if (markersRef.current[_id]) {
        // Update existing marker position if needed
        const currentLayer = markersRef.current[_id];
        const currentLatLng = currentLayer.getLatLng();
        
        if (currentLatLng.lat !== position[0] || currentLatLng.lng !== position[1]) {
          currentLayer.setLatLng(position);
        }
      } else {
        // Create new marker
        const icon = createCustomIcon(type, ecoRating);
        const marker = L.marker(position, { icon });
        
        // Create popup with eco-friendly styling
        const popupContent = `
          <div style="
            padding: 8px;
            max-width: 200px;
            font-family: system-ui, -apple-system, sans-serif;
          ">
            <h3 style="
              margin: 0 0 6px;
              font-size: 16px;
              font-weight: 600;
              color: #334155;
            ">${name}</h3>
            
            ${ecoRating ? `
              <div style="
                margin-top: 4px;
                display: flex;
                align-items: center;
              ">
                <div style="
                  background: ${ecoRating > 80 ? '#22c55e' : ecoRating > 60 ? '#84cc16' : '#eab308'};
                  height: 8px;
                  width: ${Math.min(100, ecoRating)}%;
                  border-radius: 4px;
                "></div>
                <span style="
                  margin-left: 6px;
                  font-size: 12px;
                  color: #64748b;
                ">${ecoRating}% eco-friendly</span>
              </div>
            ` : ''}
            
            <button 
              class="view-details-button"
              style="
                margin-top: 8px;
                padding: 4px 12px;
                background-color: #22c55e;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
                transition: background-color 0.2s;
              "
              onmouseover="this.style.backgroundColor='#16a34a'"
              onmouseout="this.style.backgroundColor='#22c55e'"
              data-id="${_id}"
            >
              View Details
            </button>
          </div>
        `;
        
        const popup = L.popup({
          closeButton: false,
          offset: [0, -20],
          className: 'eco-popup',
        }).setContent(popupContent);
        
        marker.bindPopup(popup);
        
        // Add click handler
        marker.on('click', () => {
          setSelectedMarker(_id);
          
          if (onMarkerClick) {
            onMarkerClick(listing);
          }
        });
        
        // Handle clicks on the view details button in popup
        marker.on('popupopen', () => {
          setTimeout(() => {
            const button = document.querySelector('.view-details-button[data-id="' + _id + '"]');
            if (button) {
              button.addEventListener('click', () => {
                if (onMarkerClick) {
                  onMarkerClick(listing);
                }
              });
            }
          }, 10);
        });
        
        clusterRef.current!.addLayer(marker);
        markersRef.current[_id] = marker;
      }
    });
    
    // Fit bounds if we have valid coordinates
    if (hasValidCoordinates && bounds.isValid() && listings.length > 1) {
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true
      });
    }
    
    setIsLoading(false);
  }, [listings, isMapInitialized, onMarkerClick]);
  
  // Handle map resize when the container size changes
  const handleResize = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, []);
  
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={containerRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <span className="mt-4 text-sm text-gray-600">Loading eco-friendly locations...</span>
          </div>
        </div>
      )}
      
      {/* Map controls for eco view */}
      {isInteractive && isMapInitialized && (
        <div className="absolute bottom-4 left-4 flex flex-col space-y-2 z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-white rounded-full shadow-md flex items-center justify-center text-primary-600 hover:bg-primary-50"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setView(center, zoom);
              }
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </motion.button>
          
          {userLocation && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-white rounded-full shadow-md flex items-center justify-center text-blue-600 hover:bg-blue-50"
              onClick={() => {
                if (mapRef.current && userLocation) {
                  mapRef.current.setView(userLocation, 14);
                }
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </motion.button>
          )}
        </div>
      )}
      
      {/* Eco badge */}
      {ecoView && (
        <div className="absolute top-4 right-4 bg-primary-500/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg z-10 flex items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1.5">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
          Eco View
        </div>
      )}
    </div>
  )
}
