import { useJsApiLoader } from '@react-google-maps/api';

// Single stable reference so both MapPicker and AdminMap share the same loader instance
const LIBRARIES = ['places'];

export function useGoogleMaps() {
  return useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });
}
