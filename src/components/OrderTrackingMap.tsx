"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

// Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

interface LocationPoint {
  location_lat: number;
  location_lng: number;
  speed_kmh?: number;
  accuracy_meters?: number;
  recorded_at: string;
}

interface OrderTrackingMapProps {
  locationPoints: LocationPoint[];
  pickupLocation?: { lat: number; lng: number; name: string };
  deliveryLocation?: { lat: number; lng: number; name: string };
  handoverLocation?: { lat: number; lng: number };
  riderLocation?: { lat: number; lng: number };
}

export function OrderTrackingMap({
  locationPoints,
  pickupLocation,
  deliveryLocation,
  handoverLocation,
  riderLocation
}: OrderTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script is loading or loaded, wait for it
      const checkGoogle = setInterval(() => {
        if (window.google) {
          setIsLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);

      setTimeout(() => clearInterval(checkGoogle), 10000); // timeout after 10 seconds
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    // Don't remove script on cleanup as other components may be using it
  }, []);

  // Initialize map when loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    try {
      // Default center (Sri Lanka)
      const defaultCenter = { lat: 6.9271, lng: 79.8612 };

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(mapInstance);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error initializing map');
    }
  }, [isLoaded]);

  // Draw tracking data on map
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers and polylines
    // (store them in map.data or separate refs if needed)

    const bounds = new window.google.maps.LatLngBounds();

    // Add pickup marker
    if (pickupLocation) {
      new window.google.maps.Marker({
        position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: pickupLocation.name || 'Pickup Location',
      });
      bounds.extend({ lat: pickupLocation.lat, lng: pickupLocation.lng });
    }

    // Add delivery marker
    if (deliveryLocation) {
      new window.google.maps.Marker({
        position: { lat: deliveryLocation.lat, lng: deliveryLocation.lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: deliveryLocation.name || 'Delivery Location',
      });
      bounds.extend({ lat: deliveryLocation.lat, lng: deliveryLocation.lng });
    }

    // Add handover marker if exists
    if (handoverLocation) {
      new window.google.maps.Marker({
        position: { lat: handoverLocation.lat, lng: handoverLocation.lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#F59E0B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: 'Handover Point',
      });
      bounds.extend({ lat: handoverLocation.lat, lng: handoverLocation.lng });
    }

    // Draw route polyline from location points
    if (locationPoints && locationPoints.length > 0) {
      const path = locationPoints.map(point => ({
        lat: point.location_lat,
        lng: point.location_lng,
      }));

      new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#6366F1',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map,
      });

      // Add marker for current position (last point)
      const lastPoint = locationPoints[locationPoints.length - 1];
      new window.google.maps.Marker({
        position: { lat: lastPoint.location_lat, lng: lastPoint.location_lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#6366F1',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          rotation: 0, // You could calculate bearing from last 2 points
        },
        title: `Current Position (${new Date(lastPoint.recorded_at).toLocaleTimeString()})`,
      });

      // Extend bounds to include all tracking points
      locationPoints.forEach(point => {
        bounds.extend({ lat: point.location_lat, lng: point.location_lng });
      });
    } else if (riderLocation && riderLocation.lat !== 0 && riderLocation.lng !== 0) {
      // Show rider's current location if no tracking points available
      new window.google.maps.Marker({
        position: { lat: riderLocation.lat, lng: riderLocation.lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#6366F1',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: 'Rider Current Location',
      });
      bounds.extend({ lat: riderLocation.lat, lng: riderLocation.lng });
    }

    // Fit map to bounds
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  }, [map, locationPoints, pickupLocation, deliveryLocation, handoverLocation, riderLocation]);

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-2">
        <div className="font-semibold text-gray-700 mb-2">Legend</div>
        {pickupLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Pickup</span>
          </div>
        )}
        {handoverLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">Handover</span>
          </div>
        )}
        {deliveryLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Hospital</span>
          </div>
        )}
        {locationPoints.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-indigo-500"></div>
            <span className="text-gray-600">Rider Path</span>
          </div>
        ) : riderLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-gray-600">Rider Location</span>
          </div>
        )}
      </div>
    </div>
  );
}
