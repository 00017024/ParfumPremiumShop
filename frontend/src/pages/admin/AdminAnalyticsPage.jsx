import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AdminMap from '@/components/AdminMap';

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
      <div
        className="bg-surface-card border border-neutral-border rounded-sm overflow-hidden"
        style={{ height: '560px' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-text-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading locations…</span>
          </div>
        ) : (
          <AdminMap locations={locations} />
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
