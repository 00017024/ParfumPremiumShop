import { useCallback } from 'react';
import { GoogleMap, MarkerClusterer, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGoogleMaps } from '@/lib/googleMapsLoader';

const INITIAL_CENTER = { lat: 41.3, lng: 64.6 };
const INITIAL_ZOOM   = 6;

const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

/**
 * Purpose: Generates a canvas-drawn gold circle cluster icon as a data URL.
 * Input: count – number of markers in the cluster (drives icon size via log2 scaling)
 * Output: { url, size, anchor } for use as a MarkerClusterer style entry.
 */
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
 * Purpose: Renders a clustered Google Map of order delivery locations for the admin analytics page.
 * Input: locations – array of { lat, lng } objects
 */
export default function AdminMap({ locations = [] }) {
  const { t } = useTranslation();
  const { isLoaded, loadError } = useGoogleMaps();

  /**
   * Purpose: Renders a Marker for each location inside the MarkerClusterer render-prop callback.
   */
  const renderMarkers = useCallback(
    (clusterer) =>
      locations.map((loc, i) => (
        <Marker
          key={i}
          position={{ lat: loc.lat, lng: loc.lng }}
          clusterer={clusterer}
          title={t('admin.analytics.order_location', { n: i + 1 })}
        />
      )),
    [locations, t]
  );

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500">
        {t('admin.analytics.map_load_error')}
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
