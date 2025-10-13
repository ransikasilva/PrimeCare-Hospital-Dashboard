"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { useHospitalRiders, useCollectionCenters, usePendingApprovals, useHospitalDashboard } from '@/hooks/useApi';
import { useMyHospitals } from '@/hooks/useApi';

// Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Rider {
  id: string;
  rider_name: string;
  phone: string;
  availability_status: 'available' | 'busy' | 'offline';
  current_location?: {
    lat: number;
    lng: number;
  };
}

interface CollectionCenter {
  id: string;
  center_name: string;
  center_type: 'dependent' | 'independent';
  contact_person: string;
  phone: string;
  city: string;
  status: string;
  coordinates_lat: number;
  coordinates_lng: number;
  active_orders: number;
}

export function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Get hospital data
  const { data: hospitalsData } = useMyHospitals();
  const hospitalId = hospitalsData?.data?.hospitals?.[0]?.id;
  
  // Get riders data - only call if we have a hospitalId
  const shouldFetchRiders = !!hospitalId;
  const { data: ridersData, loading: ridersLoading, error: ridersError } = useHospitalRiders(shouldFetchRiders ? hospitalId : '');
  
  // Get collection centers data - try both endpoints
  const shouldFetchCenters = !!hospitalId;
  const { data: centersData, loading: centersLoading } = useCollectionCenters(shouldFetchCenters ? hospitalId : '');
  const { data: approvalsData, loading: approvalsLoading } = usePendingApprovals(shouldFetchCenters ? hospitalId : '');
  const { data: dashboardData } = useHospitalDashboard();
  
  // Extract riders safely with memoization
  const riders: Rider[] = useMemo(() => {
    let extractedRiders: Rider[] = [];
    
    if (ridersData?.data) {
      const data = ridersData.data as any;
      if (Array.isArray(data.riders)) {
        extractedRiders = data.riders;
      } else if (Array.isArray(data)) {
        extractedRiders = data;
      }
    }
    
    // No mock riders - only show real riders affiliated with this hospital
    
    return extractedRiders;
  }, [ridersData, hospitalId]);

  // Extract collection centers safely with memoization - try multiple data sources
  const collectionCenters: CollectionCenter[] = useMemo(() => {
    // Try the hospital dashboard data first (this has Elite Medical!)
    if (dashboardData?.data?.collection_centers) {
      const dashboardCenters = dashboardData.data.collection_centers.filter((center: any) => 
        center.coordinates_lat && center.coordinates_lng
      );
      console.log('LiveMap - Found centers in dashboard data:', dashboardCenters.length, dashboardCenters);
      if (dashboardCenters.length > 0) {
        return dashboardCenters;
      }
    }
    
    // Try the dedicated collection centers endpoint
    if (centersData?.data?.collection_centers) {
      return centersData.data.collection_centers.filter((center: any) => 
        center.coordinates_lat && center.coordinates_lng
      );
    }
    
    // Fallback to pending approvals data - but filter for only centers approved by this hospital
    if (approvalsData?.data?.collection_centers) {
      return approvalsData.data.collection_centers.filter((center: any) => {
        // Only show centers that have GPS coordinates AND are approved by this specific hospital
        const hasCoordinates = center.coordinates_lat && center.coordinates_lng;
        const isApprovedByThisHospital = (center.status === 'approved' || center.status === 'pending_hq_approval') && 
          (center.approved_by_hospital === hospitalId || center.hospital_id === hospitalId);
        
        console.log('LiveMap - Filtering center:', center.center_name, 
          'hasCoordinates:', hasCoordinates, 
          'status:', center.status,
          'approved_by_hospital:', center.approved_by_hospital,
          'hospital_id:', center.hospital_id,
          'isApprovedByThisHospital:', isApprovedByThisHospital);
        
        return hasCoordinates && isApprovedByThisHospital;
      });
    }
    
    // Only show real collection centers from API - no mock data
    return [];
  }, [dashboardData, centersData, approvalsData, hospitalId]);

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('LiveMap - Hospital ID:', hospitalId);
    console.log('LiveMap - Hospitals Data:', hospitalsData);
    console.log('LiveMap - Riders Data:', ridersData);
    console.log('LiveMap - Centers Data:', centersData);
    console.log('LiveMap - Approvals Data:', approvalsData);
    console.log('LiveMap - Processed Riders:', riders);
    console.log('LiveMap - Processed Collection Centers:', collectionCenters);
    console.log('LiveMap - Riders Error:', ridersError);
    console.log('LiveMap - Should Fetch Riders:', shouldFetchRiders);
    console.log('LiveMap - Should Fetch Centers:', shouldFetchCenters);
    console.log('LiveMap - Google Maps API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET');
    console.log('LiveMap - Google Maps Loaded:', typeof window !== 'undefined' && !!window.google);
    console.log('LiveMap - Is Loaded State:', isLoaded);
    console.log('LiveMap - Map Instance:', map);
    console.log('LiveMap - Map Error:', mapError);
  }

  // Count riders by status
  const riderCounts = {
    available: riders.filter(r => r.availability_status === 'available').length,
    busy: riders.filter(r => r.availability_status === 'busy').length,
    offline: riders.filter(r => r.availability_status === 'offline').length,
  };

  // Count collection centers
  const centerCounts = {
    total: collectionCenters.length,
    withGPS: collectionCenters.filter(c => c.coordinates_lat && c.coordinates_lng).length,
    active: collectionCenters.filter(c => c.active_orders > 0).length,
  };

  // Load Google Maps script
  useEffect(() => {
    console.log('LiveMap - Script loading effect triggered');
    console.log('LiveMap - API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    
    if (typeof window !== 'undefined' && window.google) {
      console.log('LiveMap - Google Maps already loaded');
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('LiveMap - Google Maps script already exists, waiting for load');
      const checkLoaded = () => {
        if (window.google) {
          console.log('LiveMap - Google Maps loaded via existing script');
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    console.log('LiveMap - Creating new Google Maps script');
    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log('LiveMap - Using API key:', apiKey ? 'KEY_PROVIDED' : 'NO_KEY');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    
    // Add global callback
    (window as any).initMap = () => {
      console.log('LiveMap - Global initMap callback fired');
      setIsLoaded(true);
    };
    
    script.onload = () => {
      console.log('LiveMap - Google Maps script loaded successfully');
      setIsLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('LiveMap - Failed to load Google Maps script:', error);
      setMapError('Failed to load Google Maps. Please check your API key and network connection.');
    };
    
    document.head.appendChild(script);
    console.log('LiveMap - Google Maps script added to head');

    return () => {
      // Don't remove script on cleanup to avoid reloading
    };
  }, []);

  // Initialize map
  useEffect(() => {
    console.log('LiveMap - Map initialization effect triggered', { isLoaded, hasMapRef: !!mapRef.current, hasMap: !!map });
    
    if (!isLoaded || !mapRef.current || map) return;

    try {
      console.log('LiveMap - Initializing Google Maps instance');
      console.log('LiveMap - Map container dimensions:', {
        width: mapRef.current.offsetWidth,
        height: mapRef.current.offsetHeight,
        clientWidth: mapRef.current.clientWidth,
        clientHeight: mapRef.current.clientHeight
      });
      
      // Default to Colombo, Sri Lanka if no hospital location
      const defaultCenter = { lat: 6.9271, lng: 79.8612 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 11,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      });

      console.log('LiveMap - Map instance created successfully', mapInstance);

      // Add CSS for marker labels
      const style = document.createElement('style');
      style.textContent = `
        .map-marker-label {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px !important;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `;
      document.head.appendChild(style);

      setMap(mapInstance);
      setMapError(null);
      console.log('LiveMap - Map state updated');
      
      // Add debugging for map tiles loading
      window.google.maps.event.addListener(mapInstance, 'tilesloaded', () => {
        console.log('LiveMap - Map tiles loaded successfully');
      });
      
      window.google.maps.event.addListener(mapInstance, 'idle', () => {
        console.log('LiveMap - Map is idle (finished loading/panning/zooming)');
      });
      
      // Add error listener
      window.google.maps.event.addListener(mapInstance, 'error', (error: any) => {
        console.error('LiveMap - Map error:', error);
      });
      
      // Trigger map resize after a short delay to ensure proper rendering
      setTimeout(() => {
        window.google.maps.event.trigger(mapInstance, 'resize');
        mapInstance.setCenter(defaultCenter);
        mapInstance.setZoom(11);
        console.log('LiveMap - Map resize triggered');
        
        // Force another resize after a longer delay
        setTimeout(() => {
          window.google.maps.event.trigger(mapInstance, 'resize');
          console.log('LiveMap - Second map resize triggered');
        }, 500);
      }, 100);
    } catch (error) {
      console.error('LiveMap - Failed to initialize map:', error);
      setMapError('Failed to initialize map');
    }
  }, [isLoaded, map]);

  // Update markers when riders or collection centers data changes
  useEffect(() => {
    console.log('LiveMap - Markers update effect triggered', { hasMap: !!map, ridersCount: riders.length, centersCount: collectionCenters.length });
    
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];
    console.log('LiveMap - Starting to add markers');

    // Add markers for riders with locations
    riders.forEach((rider) => {
      console.log('LiveMap - Processing rider:', rider.rider_name, rider.current_location);
      if (!rider.current_location) return;

      const { lat, lng } = rider.current_location;
      
      // Choose marker color and emoji based on status
      let markerColor = '#6B7280'; // gray for offline
      let statusBadge = 'bg-gray-100 text-gray-800';
      if (rider.availability_status === 'available') {
        markerColor = '#10B981'; // green
        statusBadge = 'bg-green-100 text-green-800';
      }
      if (rider.availability_status === 'busy') {
        markerColor = '#3B82F6'; // blue
        statusBadge = 'bg-blue-100 text-blue-800';
      }

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `${rider.rider_name} - ${rider.availability_status}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="${markerColor}" stroke="#FFFFFF" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">🏍️</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16),
        }
      });

      // Create detailed info window for rider
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 min-w-48">
            <div class="flex items-center mb-2">
              <span class="text-2xl mr-2">🏍️</span>
              <h3 class="font-bold text-gray-900 text-lg">${rider.rider_name}</h3>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex items-center">
                <span class="w-16 text-gray-600">Phone:</span>
                <span class="font-medium">${rider.phone}</span>
              </div>
              <div class="flex items-center">
                <span class="w-16 text-gray-600">Status:</span>
                <span class="inline-block px-2 py-1 ${statusBadge} rounded text-xs font-medium">
                  ${rider.availability_status.charAt(0).toUpperCase() + rider.availability_status.slice(1)}
                </span>
              </div>
              <div class="flex items-center">
                <span class="w-16 text-gray-600">Location:</span>
                <span class="text-xs text-gray-500">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
              </div>
            </div>
          </div>
        `,
        maxWidth: 250
      });

      // Add hover effect for riders
      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      // Also show on click for mobile devices
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      console.log('LiveMap - Added rider marker:', rider.rider_name);
      newMarkers.push(marker);
    });

    // Add markers for collection centers with coordinates
    collectionCenters.forEach((center) => {
      console.log('LiveMap - Processing center:', center.center_name, { lat: center.coordinates_lat, lng: center.coordinates_lng });
      if (!center.coordinates_lat || !center.coordinates_lng) return;

      const lat = parseFloat(center.coordinates_lat.toString());
      const lng = parseFloat(center.coordinates_lng.toString());
      
      // Create custom marker with center name label
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `${center.center_name} - ${center.center_type}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/>
              <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">🏥</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
        },
        label: {
          text: center.center_name,
          color: '#1F2937',
          fontSize: '12px',
          fontWeight: 'bold',
          className: 'map-marker-label'
        }
      });

      // Create detailed info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 min-w-64">
            <div class="flex items-center mb-2">
              <span class="text-2xl mr-2">🏥</span>
              <h3 class="font-bold text-gray-900 text-lg">${center.center_name}</h3>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Contact:</span>
                <span class="font-medium">${center.contact_person}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Phone:</span>
                <span class="font-medium">${center.phone}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Location:</span>
                <span class="font-medium">${center.city}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Type:</span>
                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">${center.center_type}</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Orders:</span>
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">${center.active_orders} active</span>
              </div>
              <div class="flex items-center">
                <span class="w-20 text-gray-600">Status:</span>
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">${center.status}</span>
              </div>
            </div>
          </div>
        `,
        maxWidth: 300
      });

      // Add hover effect (mouseover/mouseout)
      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      // Also show on click for mobile devices
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      console.log('LiveMap - Added center marker:', center.center_name);
      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;
    console.log('LiveMap - Total markers added:', newMarkers.length);

    // Fit map to show all markers if there are any
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      
      // Add padding to bounds
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
      
      // Set zoom constraints
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom > 16) {
          map.setZoom(16);
        } else if (currentZoom < 8) {
          map.setZoom(8);
        }
        window.google.maps.event.removeListener(listener);
      });
    } else {
      // If no markers, center on Colombo with reasonable zoom
      map.setCenter({ lat: 6.9271, lng: 79.8612 });
      map.setZoom(11);
    }

  }, [map, riders, collectionCenters]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Map Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Rider Locations (Map View Unavailable)</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Available ({riderCounts.available})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Busy ({riderCounts.busy})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Offline ({riderCounts.offline})</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Locations List */}
        <div className="p-4 space-y-3 h-96 overflow-y-auto">
          {riders.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🏍️ Riders</h4>
              {riders.map((rider) => (
                <div key={rider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{rider.rider_name}</p>
                    <p className="text-sm text-gray-600">{rider.phone}</p>
                    {rider.current_location && (
                      <p className="text-xs text-gray-500">
                        GPS: {rider.current_location.lat.toFixed(4)}, {rider.current_location.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      rider.availability_status === 'available' ? 'bg-green-500' :
                      rider.availability_status === 'busy' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></span>
                    <span className="text-sm font-medium">
                      {rider.availability_status?.charAt(0).toUpperCase() + rider.availability_status?.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {collectionCenters.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🏥 Collection Centers</h4>
              {collectionCenters.map((center) => (
                <div key={center.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{center.center_name}</p>
                    <p className="text-sm text-gray-600">{center.contact_person}</p>
                    <p className="text-sm text-gray-600">{center.city}</p>
                    <p className="text-xs text-gray-500">
                      GPS: {parseFloat(center.coordinates_lat.toString()).toFixed(4)}, {parseFloat(center.coordinates_lng.toString()).toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block w-3 h-3 rounded-full mr-2 bg-orange-500"></span>
                    <span className="text-sm font-medium">{center.center_type}</span>
                    <p className="text-xs text-gray-500">{center.active_orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {riders.length === 0 && collectionCenters.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No locations found</p>
            </div>
          )}
        </div>
        
        {/* Note */}
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map view
          </p>
        </div>
      </div>
    );
  }

  if (ridersError) {
    return (
      <div className="bg-white rounded-lg shadow h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Riders</h3>
          <p className="text-gray-600">{ridersError}</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="bg-white rounded-lg shadow h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Error</h3>
          <p className="text-gray-600">{mapError}</p>
        </div>
      </div>
    );
  }

  // Don't block map rendering for loading states - show map with data as it comes in
  // if (ridersLoading || centersLoading || approvalsLoading) {
  //   return (
  //     <div className="bg-white rounded-lg shadow h-96 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading locations...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Map Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Live GPS Tracking</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Available ({riderCounts.available})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Busy ({riderCounts.busy})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Offline ({riderCounts.offline})</span>
            </div>
            {/* Collection Centers */}
            <div className="border-l border-gray-300 pl-4 ml-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Centers ({centerCounts.total})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="h-[500px] w-full border" 
        style={{ 
          minHeight: '500px',
          height: '500px',
          width: '100%',
          position: 'relative',
          backgroundColor: '#f0f0f0' // Temporary background to see if container is visible
        }}
      />
      
      {/* Status Bar */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="text-sm text-gray-600">
          <p><strong>Debug Info:</strong></p>
          <p>Riders: {riders.length} | Centers: {collectionCenters.length}</p>
          <p>Hospital ID: {hospitalId || 'Not set'}</p>
          <p>Riders Loading: {ridersLoading ? 'Yes' : 'No'} | Error: {ridersError || 'None'}</p>
          <p>Centers Loading: {centersLoading ? 'Yes' : 'No'}</p>
          {riders.length === 0 && collectionCenters.length === 0 && !ridersLoading && !centersLoading && !approvalsLoading && (
            <p className="text-red-600 mt-2">⚠️ No data found - check API connection and authentication</p>
          )}
        </div>
      </div>
    </div>
  );
}