import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Supercluster from 'supercluster';
import { MapPin } from 'lucide-react';

const MAP_STYLE = 'https://demotiles.maplibre.org/style.json';

const INITIAL_VIEW = {
  longitude: 64.6,
  latitude:  41.3,
  zoom:      6,
};

/**
 * Build GeoJSON feature array from locations array [{ lat, lng }]
 */
function toFeatures(locations) {
  return locations.map((loc, i) => ({
    type: 'Feature',
    id:   i,
    geometry: {
      type:        'Point',
      coordinates: [loc.lng, loc.lat],
    },
    properties: { lat: loc.lat, lng: loc.lng },
  }));
}

/**
 * AdminMap
 *
 * Props:
 *   locations — Array<{ lat: number, lng: number }>
 */
export default function AdminMap({ locations = [] }) {
  const mapRef             = useRef(null);
  const superclusterRef    = useRef(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [clusters, setClusters]   = useState([]);

  // ── Build supercluster index whenever locations change ──────────────────────
  useEffect(() => {
    if (!locations.length) {
      setClusters([]);
      superclusterRef.current = null;
      return;
    }

    const sc = new Supercluster({ radius: 55, maxZoom: 17 });
    sc.load(toFeatures(locations));
    superclusterRef.current = sc;

    // Compute initial clusters with world bounds (map may not be ready yet)
    setClusters(sc.getClusters([-180, -90, 180, 90], Math.floor(INITIAL_VIEW.zoom)));
  }, [locations]);

  // ── Recompute clusters after any pan/zoom ───────────────────────────────────
  const refreshClusters = useCallback((nextViewState) => {
    const sc = superclusterRef.current;
    if (!sc) return;

    const map = mapRef.current?.getMap();
    let bbox = [-180, -90, 180, 90];

    if (map) {
      const b = map.getBounds();
      bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    }

    setClusters(sc.getClusters(bbox, Math.floor(nextViewState.zoom)));
  }, []);

  const handleMoveEnd = useCallback(
    (e) => {
      setViewState(e.viewState);
      refreshClusters(e.viewState);
    },
    [refreshClusters]
  );

  // ── Click a cluster → zoom in to its expansion zoom ────────────────────────
  const handleClusterClick = useCallback((clusterId, lng, lat) => {
    const sc = superclusterRef.current;
    if (!sc) return;

    const expansionZoom = Math.min(sc.getClusterExpansionZoom(clusterId), 17);
    setViewState((v) => ({ ...v, longitude: lng, latitude: lat, zoom: expansionZoom }));
  }, []);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      onMoveEnd={handleMoveEnd}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {clusters.map((cluster) => {
        const [lng, lat]            = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count, cluster_id } = cluster.properties;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster_id}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
              onClick={() => handleClusterClick(cluster_id, lng, lat)}
            >
              <ClusterBubble count={point_count} />
            </Marker>
          );
        }

        return (
          <Marker
            key={`pin-${cluster.id}`}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
          >
            <MapPin
              className="w-5 h-5 drop-shadow"
              style={{ color: '#D4AF37', fill: '#D4AF37' }}
            />
          </Marker>
        );
      })}
    </Map>
  );
}

// ── ClusterBubble ─────────────────────────────────────────────────────────────

function ClusterBubble({ count }) {
  // Scale circle size logarithmically with point count
  const size = Math.min(18 + Math.log2(count) * 8, 56);

  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-brand-black
                 cursor-pointer select-none transition-transform hover:scale-110 active:scale-95
                 shadow-md"
      style={{
        width:           size,
        height:          size,
        fontSize:        Math.max(10, size * 0.32),
        backgroundColor: '#D4AF37',
        border:          '2px solid rgba(255,255,255,0.35)',
      }}
      title={`${count} orders — click to expand`}
    >
      {count}
    </div>
  );
}
