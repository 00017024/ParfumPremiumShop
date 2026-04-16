import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Fix Leaflet's broken default marker icons when bundled with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIconUrl,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
});

const UZBEKISTAN_CENTER = [41.3, 64.6];
const INITIAL_ZOOM = 6;

export default function AdminAnalyticsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/admin/order-locations')
      .then(({ data }) => setLocations(data))
      .catch(() => toast.error('Failed to load order locations', {
        style: { background: '#dc2626', color: '#fff' },
      }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Order Locations</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Delivery pins from all placed orders
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 bg-surface-card border border-neutral-border rounded-sm px-4 py-2">
            <MapPin className="w-4 h-4 text-brand-gold" aria-hidden="true" />
            <span className="text-sm text-text-primary font-medium">{locations.length}</span>
            <span className="text-sm text-text-muted">pinned orders</span>
          </div>
        )}
      </div>

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <div className="bg-surface-card border border-neutral-border rounded-sm overflow-hidden"
           style={{ height: '560px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-text-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading locations…</span>
          </div>
        ) : (
          <MapContainer
            center={UZBEKISTAN_CENTER}
            zoom={INITIAL_ZOOM}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {locations.map((loc, i) => (
              <Marker key={i} position={[loc.lat, loc.lng]}>
                <Popup>
                  <span className="text-xs">
                    {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                  </span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {!loading && locations.length === 0 && (
        <p className="text-sm text-text-muted text-center py-4">
          No order locations recorded yet.
        </p>
      )}

    </div>
  );
}
