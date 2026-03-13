import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RotateCcw, ClipboardList, ArrowLeft, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import Layout from '@/components/layout/Layout';

// ─── Status badge config ──────────────────────────────────────────────────────
// Shared with MyOrdersPage — consider extracting to a shared util if reused further

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

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section
      className="bg-surface-card border border-neutral-border rounded-sm p-6 flex flex-col gap-4"
      aria-label={title}
    >
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted pb-2 border-b border-neutral-border">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
      <span className="text-[11px] uppercase tracking-widest text-text-muted w-28 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-40 bg-neutral-800 rounded" />
        <div className="h-3 w-28 bg-neutral-800 rounded" />
      </div>

      {/* Three section cards */}
      {[80, 120, 160].map((h, i) => (
        <div
          key={i}
          className="bg-surface-card border border-neutral-border rounded-sm p-6 flex flex-col gap-3"
        >
          <div className="h-3 w-32 bg-neutral-800 rounded" />
          <div className={`bg-neutral-800 rounded`} style={{ height: h }} />
        </div>
      ))}
    </div>
  );
}

// ─── OrderDetailsPage ─────────────────────────────────────────────────────────

export default function OrderDetailsPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch {
      setError(true);
      toast.error('Failed to load order', {
        style: { background: '#dc2626', color: '#fff' },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // ─── Cancel order ─────────────────────────────────────────────────────────
  // Only available for PENDING or PAID orders. Asks for confirmation,
  // sends PATCH to update status, then refreshes order data on success.

  const CANCELLABLE_STATUSES = ['PENDING', 'PAID'];

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    try {
      await api.put(`/orders/${id}/status`, { status: 'CANCELLED' });
      toast.success('Order cancelled successfully', {
        style: { background: '#16a34a', color: '#fff' },
      });
      fetchOrder();
    } catch {
      toast.error('Failed to cancel order', {
        style: { background: '#dc2626', color: '#fff' },
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Back link ────────────────────────────────────────────── */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-text-muted hover:text-brand-gold transition-colors mb-8"
          aria-label="Back to my orders"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          My Orders
        </Link>

        {/* ── Loading ───────────────────────────────────────────────── */}
        {loading && <PageSkeleton />}

        {/* ── Error ─────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-6 py-24 text-center">
            <p className="text-text-muted text-sm">Unable to load order details.</p>
            <button
              onClick={fetchOrder}
              aria-label="Retry loading order details"
              className="inline-flex items-center gap-2 border border-brand-gold text-brand-gold px-6 py-3 text-sm uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* ── Order content ─────────────────────────────────────────── */}
        {!loading && !error && order && (() => {
          const shortId = order._id.slice(-6).toUpperCase();
          const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          });

          return (
            <div className="flex flex-col gap-6">

              {/* ── Page header ───────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-brand-gold" aria-hidden="true" />
                  <div>
                    <h1 className="text-2xl font-light text-text-primary tracking-wide">
                      Order Details
                    </h1>
                    <p className="text-xs text-text-muted mt-0.5">
                      <span className="text-brand-gold">#{shortId}</span>
                      <span className="mx-2 opacity-40">·</span>
                      {formattedDate}
                    </p>
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* ── Section 1: Order Information ──────────────────────── */}
              <Section title="Order Information">
                <InfoRow label="Order ID"   value={`#${shortId}`} />
                <InfoRow label="Date"       value={formattedDate} />
                <InfoRow label="Status"     value={order.status} />
                <InfoRow label="Total"      value={`$${Number(order.totalPrice).toFixed(2)}`} />

                {/* ── Cancel button — only for PENDING or PAID orders ─── */}
                {CANCELLABLE_STATUSES.includes(order.status) && (
                  <div className="pt-2">
                    <button
                      onClick={cancelOrder}
                      disabled={cancelling}
                      aria-label="Cancel order"
                      className="inline-flex items-center gap-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 uppercase tracking-widest text-xs px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      {cancelling ? 'Cancelling…' : 'Cancel Order'}
                    </button>
                  </div>
                )}
              </Section>

              {/* ── Section 2: Delivery Information ───────────────────── */}
              <Section title="Delivery Information">
                <InfoRow label="Name"    value={order.customerName} />
                <InfoRow label="Phone"   value={order.phone} />
                <InfoRow label="City"    value={order.city} />
                <InfoRow label="Address" value={order.address} />
                {order.notes && (
                  <InfoRow label="Notes" value={order.notes} />
                )}
              </Section>

              {/* ── Section 3: Ordered Items ───────────────────────────── */}
              <Section title="Ordered Items">
                <ul className="flex flex-col divide-y divide-neutral-border" aria-label="Order items">
                  {order.items.map((item, idx) => {
                    const product = item.product;
                    const lineTotal = (product.price * item.quantity).toFixed(2);
                    const fallback = `https://placehold.co/64x64/2A2A2A/D4AF37?text=${encodeURIComponent(product.brand ?? '?')}`;

                    return (
                      <li key={product._id ?? idx} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">

                        {/* Image */}
                        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-sm bg-surface-dark">
                          <img
                            src={product.imageUrl || fallback}
                            alt={`${product.brand} ${product.name}`}
                            onError={(e) => { e.currentTarget.src = fallback; }}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {product.name}
                          </p>
                          <p className="text-[11px] uppercase tracking-widest text-text-muted mt-0.5">
                            {product.brand}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                            <span>${Number(product.price).toFixed(2)}</span>
                            <span className="opacity-30">·</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>

                        {/* Line total */}
                        <p className="text-sm font-medium text-text-primary flex-shrink-0">
                          ${lineTotal}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                {/* Order total */}
                <div className="border-t border-neutral-border pt-4 flex justify-between items-baseline">
                  <span className="text-xs uppercase tracking-widest text-text-muted">
                    Order Total
                  </span>
                  <span className="text-xl font-light text-brand-gold">
                    ${Number(order.totalPrice).toFixed(2)}
                  </span>
                </div>
              </Section>

            </div>
          );
        })()}

      </div>
    </Layout>
  );
}