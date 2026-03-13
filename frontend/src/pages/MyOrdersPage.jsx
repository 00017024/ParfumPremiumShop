import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PackageSearch, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import Layout from '@/components/layout/Layout';
import EmptyState from '@/components/product/EmptyState';

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_STYLES = {
  PENDING:   'bg-brand-gold/15 text-brand-gold border border-brand-gold/30',
  PAID:      'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  CONFIRMED: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  COMPLETED: 'bg-green-500/15 text-green-400 border border-green-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] ?? 'bg-neutral-700 text-text-muted border border-neutral-600';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-surface-card border border-neutral-border rounded-sm p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 bg-neutral-800 rounded" />
          <div className="h-3 w-24 bg-neutral-800 rounded" />
        </div>
        <div className="h-6 w-20 bg-neutral-800 rounded-full" />
      </div>
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-neutral-800 rounded-sm flex-shrink-0" />
        <div className="flex flex-col gap-2 justify-center flex-1">
          <div className="h-3 w-3/4 bg-neutral-800 rounded" />
          <div className="h-3 w-1/2 bg-neutral-800 rounded" />
        </div>
      </div>
      <div className="border-t border-neutral-border pt-3 flex justify-between">
        <div className="h-4 w-16 bg-neutral-800 rounded" />
        <div className="h-4 w-24 bg-neutral-800 rounded" />
      </div>
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order }) {
  const navigate = useNavigate();

  const shortId = order._id.slice(-6).toUpperCase();
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const previewItems = order.items.slice(0, 2);
  const extraCount = order.items.length - 2;

  const handleNavigate = () => navigate(`/orders/${order._id}`);

  return (
    <article
      className="bg-surface-card border border-neutral-border rounded-sm p-5 flex flex-col gap-4
                 hover:border-brand-gold/30 transition-colors duration-200 cursor-pointer"
      onClick={handleNavigate}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavigate(); }}
      tabIndex={0}
      role="button"
      aria-label={`View order #${shortId} placed on ${formattedDate}`}
    >
      {/* ── Header row ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-text-primary">
            Order <span className="text-brand-gold">#{shortId}</span>
          </p>
          <p className="text-xs text-text-muted">{formattedDate}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* ── Item previews ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {previewItems.map((item, idx) => {
          const fallback = `https://placehold.co/48x48/2A2A2A/D4AF37?text=${encodeURIComponent(item.product?.brand ?? '?')}`;
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-sm bg-surface-dark">
                <img
                  src={item.product?.imageUrl || fallback}
                  alt={`${item.product?.brand} ${item.product?.name}`}
                  onError={(e) => { e.currentTarget.src = fallback; }}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{item.product?.name}</p>
                <p className="text-[11px] text-text-muted uppercase tracking-wider">
                  {item.product?.brand}
                </p>
                <p className="text-xs text-text-muted mt-0.5">Qty: {item.quantity}</p>
              </div>
            </div>
          );
        })}

        {extraCount > 0 && (
          <p className="text-xs text-text-muted italic pl-1">
            +{extraCount} more {extraCount === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {/* ── Footer row ──────────────────────────────────────────────── */}
      <div className="border-t border-neutral-border pt-3 flex items-center justify-between">
        <p className="text-base font-light text-brand-gold">
          ${Number(order.totalPrice).toFixed(2)}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
          aria-label={`View details for order #${shortId}`}
          className="text-sm text-brand-gold hover:underline underline-offset-4 transition-all flex items-center gap-1"
        >
          View Details →
        </button>
      </div>
    </article>
  );
}

// ─── MyOrdersPage ─────────────────────────────────────────────────────────────

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data);
    } catch {
      setError(true);
      toast.error('Failed to load orders', {
        style: { background: '#dc2626', color: '#fff' },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Page header ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-2">
          <PackageSearch className="w-5 h-5 text-brand-gold" aria-hidden="true" />
          <h1 className="text-2xl font-light text-text-primary tracking-wide">
            My Orders
          </h1>
        </div>
        <p className="text-sm text-text-muted mb-10 pl-8">
          Track your purchases and order status
        </p>

        {/* ── Loading ───────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-6 py-20">
            <p className="text-text-muted text-sm">Something went wrong loading your orders.</p>
            <button
              onClick={fetchOrders}
              aria-label="Retry loading orders"
              className="inline-flex items-center gap-2 border border-brand-gold text-brand-gold px-6 py-3 text-sm uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* ── Empty ─────────────────────────────────────────────────── */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center">
            <EmptyState message="No orders yet" />
            <p className="text-sm text-text-muted -mt-4 mb-6 text-center max-w-xs">
              When you purchase perfumes, your orders will appear here.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 border border-brand-gold text-brand-gold px-6 py-3 text-sm uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-200"
            >
              Browse Perfumes
            </Link>
          </div>
        )}

        {/* ── Orders list ───────────────────────────────────────────── */}
        {!loading && !error && orders.length > 0 && (
          <div
            className="flex flex-col gap-4"
            role="list"
            aria-label="Your orders"
          >
            {orders.map((order) => (
              <div key={order._id} role="listitem">
                <OrderCard order={order} />
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}