import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useGoogleMaps } from '@/lib/googleMapsLoader';

// Tashkent fallback — center of activity
const FALLBACK_CENTER = { lat: 41.2995, lng: 69.2401 };

const GOLD_PIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#D4AF37"/>
    <circle cx="12" cy="12" r="4.5" fill="white"/>
  </svg>`
);

const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  gestureHandling: 'cooperative',
};

/**
 * MapPicker
 *
 * Props:
 *   value            — { lat, lng } | null
 *   onChange         — (coords: { lat, lng }) => void
 *   onAddressChange  — (address: string) => void   (optional)
 */
export default function MapPicker({ value, onChange, onAddressChange }) {
  const { isLoaded, loadError } = useGoogleMaps();

  const [mapCenter, setMapCenter] = useState(
    value ? { lat: value.lat, lng: value.lng } : FALLBACK_CENTER
  );
  const [zoom, setZoom] = useState(value ? 15 : 12);

  const geocoderRef      = useRef(null);
  const autocompleteRef  = useRef(null);
  const didAutoLocate    = useRef(false);

  // Build Geocoder once Maps is ready
  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Auto-detect user location on first render (skip if a value is already set)
  useEffect(() => {
    if (!isLoaded || value || didAutoLocate.current) return;
    didAutoLocate.current = true;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(coords);
        setZoom(15);
        onChange(coords);
        doReverseGeocode(coords);
      },
      () => {
        // Permission denied — stay at Tashkent fallback
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const doReverseGeocode = useCallback(
    (coords) => {
      if (!geocoderRef.current) return;
      geocoderRef.current.geocode({ location: coords }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          onAddressChange?.(results[0].formatted_address);
        }
      });
    },
    [onAddressChange]
  );

  const handleMapClick = useCallback(
    (e) => {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      onChange(coords);
      setMapCenter(coords);
      doReverseGeocode(coords);
    },
    [onChange, doReverseGeocode]
  );

  const handleMarkerDrag = useCallback(
    (e) => {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      onChange(coords);
      doReverseGeocode(coords);
    },
    [onChange, doReverseGeocode]
  );

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const coords = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    onChange(coords);
    setMapCenter(coords);
    setZoom(16);
    if (place.formatted_address) onAddressChange?.(place.formatted_address);
  }, [onChange, onAddressChange]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500 px-4 text-center">
        Map failed to load. Please check your connection.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-brand-gold" />
      </div>
    );
  }

  const markerIcon = {
    url: `data:image/svg+xml;charset=UTF-8,${GOLD_PIN_SVG}`,
    scaledSize: new window.google.maps.Size(32, 48),
    anchor: new window.google.maps.Point(16, 48),
  };

  return (
    <div className="relative w-full h-full">
      {/* Search autocomplete — restricted to Uzbekistan */}
      <Autocomplete
        onLoad={(ref) => { autocompleteRef.current = ref; }}
        onPlaceChanged={handlePlaceChanged}
        options={{ componentRestrictions: { country: 'uz' } }}
      >
        <input
          type="text"
          placeholder="Search for your address…"
          className="absolute top-2 left-2 right-2 z-10 rounded px-3 py-2 text-sm shadow-lg
                     border border-gray-200 bg-white focus:outline-none focus:border-brand-gold"
          style={{ color: '#111827' }}
        />
      </Autocomplete>

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={zoom}
        onClick={handleMapClick}
        options={MAP_OPTIONS}
      >
        {value && (
          <Marker
            position={{ lat: value.lat, lng: value.lng }}
            draggable
            onDragEnd={handleMarkerDrag}
            icon={markerIcon}
            title="Drag to adjust your delivery location"
          />
        )}
      </GoogleMap>
    </div>
  );
}
