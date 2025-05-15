import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { AnyListing } from '@/types/listing'

interface MapViewProps {
  listings: AnyListing[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (listing: AnyListing) => void
  className?: string
}

// Custom icon configuration
const createCustomIcon = (type: string) => {
  const iconColors: { [key: string]: string } = {
    coworking: '#9333EA', // purple-600
    cafe: '#CA8A04', // yellow-600
    accommodation: '#2563EB', // blue-600
    restaurant: '#DC2626', // red-600
    activities: '#16A34A', // green-600
  }

  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        background-color: ${iconColors[type] || '#000000'};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        border: 2px solid white;
      ">
        ${type[0].toUpperCase()}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

export function MapView({
  listings,
  center = [13.7563, 100.5018], // Bangkok coordinates as default
  zoom = 12,
  onMarkerClick,
  className = '',
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.MarkerClusterGroup | null>(null)
  const [map, setMap] = useState<L.Map | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      const mapInstance = L.map('map').setView(center, zoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance)

      // Initialize marker cluster group
      const markers = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount()
          return L.divIcon({
            className: 'custom-cluster-icon',
            html: `
              <div style="
                background-color: #16A34A;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                border: 2px solid white;
              ">
                ${count}
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          })
        },
      })

      mapInstance.addLayer(markers)
      markersRef.current = markers
      mapRef.current = mapInstance
      setMap(mapInstance)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current = null
        setMap(null)
      }
    }
  }, [center, zoom])

  // Update markers when listings change
  useEffect(() => {
    if (!markersRef.current || !map) return

    markersRef.current.clearLayers()

    listings.forEach((listing) => {
      if (!listing.location) return

      const marker = L.marker([listing.location.lat, listing.location.lng], {
        icon: createCustomIcon(listing.type),
      })

      // Create popup content
      const popupContent = document.createElement('div')
      popupContent.className = 'custom-popup'
      popupContent.innerHTML = `
        <div class="font-sans">
          <h3 class="font-semibold text-gray-900">${listing.name}</h3>
          <p class="text-sm text-gray-600">${listing.city.name}</p>
          <div class="mt-2 flex items-center space-x-2">
            <span class="text-sm font-medium">${listing.rating}</span>
            <svg class="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      `

      // Add button if onMarkerClick is provided
      if (onMarkerClick) {
        const button = document.createElement('button')
        button.className =
          'mt-2 w-full rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700'
        button.textContent = 'View Details'
        button.onclick = () => onMarkerClick(listing)
        popupContent.appendChild(button)
      }

      marker.bindPopup(popupContent)
      markersRef.current?.addLayer(marker)
    })

    // Fit bounds if there are markers
    if (markersRef.current.getLayers().length > 0) {
      map.fitBounds(markersRef.current.getBounds(), { padding: [50, 50] })
    }
  }, [listings, map, onMarkerClick])

  return <div id="map" className={`h-full w-full ${className}`} />
}
