"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';

interface PlaceDetails {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  province: string;
  country: string;
  place_id: string;
}

interface GooglePlacesAutocompleteProps {
  placeholder?: string;
  onPlaceSelect: (place: PlaceDetails) => void;
  defaultValue?: string;
  className?: string;
  type?: 'hospital' | 'address';
}

// Declare google types
declare global {
  interface Window {
    google: any;
    [key: string]: any; // For dynamic callback names
  }
}

export default function GooglePlacesAutocomplete({
  placeholder = "Search for hospital...",
  onPlaceSelect,
  defaultValue = "",
  className = "",
  type = 'hospital'
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);

  // Load Google Places API
  const loadGooglePlacesAPI = useCallback(() => {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading or loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script already exists, wait for it to load
      const checkGoogleLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          clearInterval(checkGoogleLoaded);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogleLoaded);
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
        }
      }, 10000);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Google Maps API key is missing');
      return;
    }

    // Create unique callback name to avoid conflicts
    const callbackName = `initGooglePlaces_${Date.now()}`;

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    // Error handling
    script.onerror = (error) => {
      console.error('Failed to load Google Maps API script:', error);
    };

    // Set up unique callback
    (window as any)[callbackName] = () => {
      // Double check that Places API is available
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        // Clean up the callback
        delete (window as any)[callbackName];
      } else {
        console.error('Google Places API not available after script load');
      }
    };

    document.head.appendChild(script);
  }, []);

  // Initialize autocomplete
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      console.warn('Google Places API not ready for autocomplete initialization');
      return;
    }

    try {
      // Bias results towards Sri Lanka
      const sriLankaBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(5.9, 79.6), // Southwest
        new window.google.maps.LatLng(9.9, 81.9)  // Northeast
      );

      const options: any = {
        bounds: sriLankaBounds,
        componentRestrictions: { country: 'lk' }, // Restrict to Sri Lanka
        strictBounds: false,
        fields: ['name', 'formatted_address', 'geometry', 'address_components', 'place_id']
      };

      // Set types based on component type - removed types to avoid INVALID_REQUEST
      // Google Places API can be finicky with types, so we'll let it show all results
      // and filter can be done in the UI if needed

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      );
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      return;
    }

    // Handle place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.error('No geometry found for place');
        return;
      }

      // Extract location details
      const latitude = place.geometry.location.lat();
      const longitude = place.geometry.location.lng();

      // Extract address components
      let city = '';
      let province = '';
      let country = '';

      if (place.address_components) {
        place.address_components.forEach((component: any) => {
          const types = component.types;

          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            province = component.long_name;
          }
          if (types.includes('country')) {
            country = component.long_name;
          }
        });
      }

      const placeDetails: PlaceDetails = {
        name: place.name || place.formatted_address || '',
        address: place.formatted_address || '',
        latitude,
        longitude,
        city,
        province,
        country,
        place_id: place.place_id || ''
      };

      setInputValue(place.name || place.formatted_address || '');
      onPlaceSelect(placeDetails);
    });
  }, [onPlaceSelect, type]);

  // Load API on mount
  useEffect(() => {
    loadGooglePlacesAPI();
  }, [loadGooglePlacesAPI]);

  // Initialize autocomplete when API is loaded
  useEffect(() => {
    if (isLoaded) {
      initializeAutocomplete();
    }
  }, [isLoaded, initializeAutocomplete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get address
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            const latlng = new window.google.maps.LatLng(latitude, longitude);

            geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
              if (status === 'OK' && results[0]) {
                const result = results[0];

                // Extract address components
                let city = '';
                let province = '';
                let country = '';

                if (result.address_components) {
                  result.address_components.forEach((component: any) => {
                    const types = component.types;

                    if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                      city = component.long_name;
                    }
                    if (types.includes('administrative_area_level_1')) {
                      province = component.long_name;
                    }
                    if (types.includes('country')) {
                      country = component.long_name;
                    }
                  });
                }

                const placeDetails: PlaceDetails = {
                  name: 'Current Location',
                  address: result.formatted_address,
                  latitude,
                  longitude,
                  city,
                  province,
                  country,
                  place_id: result.place_id || ''
                };

                setInputValue(result.formatted_address);
                onPlaceSelect(placeDetails);
              } else {
                alert('Unable to get address for current location');
              }
            });
          } else {
            // Fallback if geocoding is not available
            const placeDetails: PlaceDetails = {
              name: 'Current Location',
              address: `${latitude}, ${longitude}`,
              latitude,
              longitude,
              city: '',
              province: '',
              country: '',
              place_id: ''
            };

            setInputValue(`${latitude}, ${longitude}`);
            onPlaceSelect(placeDetails);
          }
        },
        () => {
          alert('Unable to get your current location. Please search manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white ${className}`}
            disabled={!isLoaded}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500">
              Loading Google Places...
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="px-4 py-3 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200 transition-colors flex items-center justify-center"
          title="Use current location"
          disabled={!isLoaded}
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-1">
        {type === 'hospital'
          ? 'Start typing hospital name to see suggestions'
          : 'Start typing address to see suggestions'
        }
      </p>
    </div>
  );
}