import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAdminOrderDetail } from '@/hooks/admin/useAdminOrderDetail';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import OrderStatusSelect from '@/components/admin/OrderStatusSelect';

// ─── Section wrapper ──────────────────────────────────────────────────────────

/**
 * Purpose: Card wrapper with accessible aria-label and a divider title for grouping order detail sections.
 */
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

/**
 * Purpose: Label + value row for order detail fields; returns null when value is falsy (optional fields).
 */
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

/**
 * Purpose: Full-page skeleton for the admin order detail layout while data loads.
 */
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse max-w-4xl">
      <div className="h-4 w-48 bg-surface-card rounded" />
      {[80, 140, 200].map((h, i) => (
        <div key={i} className="bg-surface-card border border-neutral-border rounded-sm p-6">
          <div className="h-3 w-32 bg-surface-dark rounded mb-4" />
          <div className="bg-surface-dark rounded" style={{ height: h }} />
        </div>
      ))}
    </div>
  );
}

// ─── AdminOrderDetailPage ─────────────────────────────────────────────────────

/**
 * Purpose: Admin order detail page with customer info, items, and a status selector for advancing the order.
 */
export default function AdminOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { order, loading, error, updating, reload, changeStatus } =
    useAdminOrderDetail(id);

  return (
    <div className="max-w-4xl">

      {/* ── Back link ────────────────────────────────────────────────── */}
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-text-muted hover:text-brand-gold transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t('admin.order_detail.back')}
      </Link>

      {loading && <PageSkeleton />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <p className="text-text-muted text-sm">{t('admin.order_detail.load_error')}</p>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 border border-brand-gold text-brand-gold px-6 py-3 text-sm uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            {t('admin.order_detail.retry')}
          </button>
        </div>
      )}

      {!loading && !error && order && (() => {
        const shortId = order._id.slice(-6).toUpperCase();
        const date = new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        });

        return (
          <div className="flex flex-col gap-6">

            {/* ── Page header ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-light text-text-primary tracking-wide">
                  #{shortId}
                </h1>
                <p className="text-xs text-text-muted mt-0.5">{date}</p>
              </div>
              <div className="flex items-center gap-4">
                <OrderStatusBadge status={order.status} />
                {updating && (
                  <Loader2 className="w-4 h-4 text-brand-gold animate-spin" />
                )}
              </div>
            </div>

            {/* ── Status management ────────────────────────────────────── */}
            <Section title={t('admin.order_detail.update_status')}>
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-sm text-text-secondary">
                  {t('admin.order_detail.current')}{' '}
                  <span className="text-text-primary font-medium">
                    {t(`admin.status.${order.status}`, { defaultValue: order.status })}
                  </span>
                </p>
                <OrderStatusSelect
                  currentStatus={order.status}
                  onChange={changeStatus}
                  loading={updating}
                />
              </div>
            </Section>

            {/* ── Order information ────────────────────────────────────── */}
            <Section title={t('admin.order_detail.section_info')}>
              <InfoRow label={t('admin.order_detail.label_order_id')} value={`#${shortId}`} />
              <InfoRow label={t('admin.order_detail.label_date')}     value={date} />
              <InfoRow label={t('admin.order_detail.label_status')}   value={t(`admin.status.${order.status}`, { defaultValue: order.status })} />
              <InfoRow label={t('admin.order_detail.label_total')}    value={`$${Number(order.totalPrice).toFixed(2)}`} />
            </Section>

            {/* ── Customer details ─────────────────────────────────────── */}
            <Section title={t('admin.order_detail.section_customer')}>
              <InfoRow label={t('admin.order_detail.label_name')}    value={order.customerName} />
              <InfoRow label={t('admin.order_detail.label_phone')}   value={order.phone} />
              <InfoRow label={t('admin.order_detail.label_city')}    value={order.city} />
              <InfoRow label={t('admin.order_detail.label_address')} value={order.address} />
              {order.notes && (
                <InfoRow label={t('admin.order_detail.label_notes')} value={order.notes} />
              )}
            </Section>

            {/* ── Items ───────────────────────────────────────────────── */}
            <Section title={t('admin.order_detail.section_items')}>
              <ul className="flex flex-col divide-y divide-neutral-border" aria-label={t('admin.order_detail.section_items')}>
                {order.items.map((item, idx) => {
                  const product = item.product;
                  const lineTotal = (product.price * item.quantity).toFixed(2);
                  const fallback = `https://placehold.co/64x64/2A2A2A/D4AF37?text=${encodeURIComponent(product.brand ?? '?')}`;

                  return (
                    <li
                      key={product._id ?? idx}
                      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="w-14 h-14 flex-shrink-0 overflow-hidden rounded-sm bg-surface-dark">
                        <img
                          src={product.imageUrl || fallback}
                          alt={`${product.brand} ${product.name}`}
                          onError={(e) => { e.currentTarget.src = fallback; }}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] uppercase tracking-widest text-text-muted mt-0.5">
                          {product.brand}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                          <span>${Number(product.price).toFixed(2)}</span>
                          <span className="opacity-30">·</span>
                          <span>{t('admin.order_detail.qty', { count: item.quantity })}</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-text-primary flex-shrink-0">
                        ${lineTotal}
                      </p>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-neutral-border pt-4 flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-widest text-text-muted">
                  {t('admin.order_detail.order_total')}
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
  );
}
