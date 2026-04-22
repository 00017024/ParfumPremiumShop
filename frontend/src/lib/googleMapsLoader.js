import { useJsApiLoader } from '@react-google-maps/api';

// Single stable reference so both MapPicker and AdminMap share the same loader instance
const LIBRARIES = ['places'];

/**
 * Purpose: Singleton wrapper around useJsApiLoader so MapPicker and AdminMap share one loader instance.
 * Output: { isLoaded, loadError } from @react-google-maps/api.
 */
export function useGoogleMaps() {
  return useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });
}
