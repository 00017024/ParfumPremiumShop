import { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';

const MAP_STYLE = 'https://demotiles.maplibre.org/style.json';

const INITIAL_VIEW = {
  longitude: 64.6,
  latitude:  41.3,
  zoom:      6,
};

/**
 * MapPicker
 *
 * Props:
 *   value    — { lat, lng } | null   — currently pinned location
 *   onChange — (coords: { lat, lng }) => void
 */
export default function MapPicker({ value, onChange }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW);

  const handleClick = useCallback(
    (e) => {
      const { lat, lng } = e.lngLat;
      onChange({ lat, lng });
    },
    [onChange]
  );

  return (
    <Map
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
      onClick={handleClick}
      cursor="crosshair"
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {value && (
        <Marker longitude={value.lng} latitude={value.lat} anchor="bottom">
          <MapPin
            className="w-7 h-7 drop-shadow-md"
            style={{ color: '#D4AF37', fill: '#D4AF37' }}
            aria-label="Selected delivery location"
          />
        </Marker>
      )}
    </Map>
  );
}
