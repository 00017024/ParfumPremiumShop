import { useCallback } from 'react';
import { GoogleMap, MarkerClusterer, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useGoogleMaps } from '@/lib/googleMapsLoader';

const INITIAL_CENTER = { lat: 41.3, lng: 64.6 };
const INITIAL_ZOOM   = 6;

const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

// Gold cluster bubbles using canvas → data URL, avoiding deprecated google.maps.Marker constructor
function makeClusterIcon(count) {
  const size   = Math.min(32 + Math.log2(Math.max(count, 1)) * 7, 60);
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth   = 2;
  ctx.stroke();

  ctx.fillStyle    = '#1a1a1a';
  ctx.font         = `bold ${Math.max(10, Math.round(size * 0.32))}px sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(count), size / 2, size / 2);

  return { url: canvas.toDataURL(), size, anchor: size / 2 };
}

// Per-cluster-size style entries (pre-generated for common counts)
const CLUSTERER_STYLES = [1, 2, 3, 4, 5].map((tier) => {
  const count = Math.pow(10, tier - 1);
  const { url, size } = makeClusterIcon(count);
  return { url, height: size, width: size, textSize: 0 };
});

/**
 * AdminMap
 *
 * Props:
 *   locations — Array<{ lat: number, lng: number }>
 */
export default function AdminMap({ locations = [] }) {
  const { isLoaded, loadError } = useGoogleMaps();

  const renderMarkers = useCallback(
    (clusterer) =>
      locations.map((loc, i) => (
        <Marker
          key={i}
          position={{ lat: loc.lat, lng: loc.lng }}
          clusterer={clusterer}
          title={`Order location ${i + 1}`}
        />
      )),
    [locations]
  );

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500">
        Failed to load map.
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

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={INITIAL_CENTER}
      zoom={INITIAL_ZOOM}
      options={MAP_OPTIONS}
    >
      <MarkerClusterer styles={CLUSTERER_STYLES}>
        {renderMarkers}
      </MarkerClusterer>
    </GoogleMap>
  );
}
