import { Link } from 'react-router-dom';
import { RotateCcw, ExternalLink } from 'lucide-react';

import { useAdminOrders } from '@/hooks/admin/useAdminOrders';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import OrderStatusSelect from '@/components/admin/OrderStatusSelect';

// ─── Table row skeleton ───────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-neutral-border animate-pulse">
      {[140, 120, 100, 80, 80, 160].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-3 bg-surface-dark rounded`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── AdminOrdersPage ──────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const {
    orders,
    total,
    pages,
    params,
    loading,
    error,
    updatingId,
    reload,
    changeStatus,
    updateParams,
  } = useAdminOrders({ page: 1, limit: 20 });

  return (
    <div className="flex flex-col gap-6 max-w-7xl">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-text-primary tracking-wide">
            Orders
          </h1>
          {!loading && (
            <p className="text-sm text-text-muted mt-1">
              {total} total order{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <button
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-brand-gold transition-colors disabled:opacity-40"
          aria-label="Refresh orders list"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Status filter ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {[null, 'PENDING', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(
          (s) => (
            <button
              key={s ?? 'all'}
              onClick={() => updateParams({ status: s ?? undefined, page: 1 })}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-sm border transition-all ${
                (params.status ?? null) === s
                  ? 'bg-brand-gold text-brand-black border-brand-gold'
                  : 'border-neutral-border text-text-muted hover:border-brand-gold/50 hover:text-text-primary'
              }`}
            >
              {s ?? 'All'}
            </button>
          )
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-surface-card border border-neutral-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Orders table">
            <thead>
              <tr className="border-b border-neutral-border">
                {['Order ID', 'Customer', 'City', 'Total', 'Date', 'Status', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-text-muted font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : orders.length === 0
                ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-text-muted"
                    >
                      No orders found.
                    </td>
                  </tr>
                )
                : orders.map((order) => {
                  const shortId = order._id.slice(-6).toUpperCase();
                  const date = new Date(order.createdAt).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' }
                  );
                  const isUpdating = updatingId === order._id;

                  return (
                    <tr
                      key={order._id}
                      className={`border-b border-neutral-border last:border-0 transition-colors ${
                        isUpdating ? 'opacity-60' : 'hover:bg-surface-dark/50'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-brand-gold">
                        #{shortId}
                      </td>
                      <td className="px-4 py-3 text-text-primary whitespace-nowrap">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {order.city}
                      </td>
                      <td className="px-4 py-3 text-text-primary whitespace-nowrap">
                        ${Number(order.totalPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap text-xs">
                        {date}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <OrderStatusSelect
                            currentStatus={order.status}
                            onChange={(newStatus) =>
                              changeStatus(order._id, newStatus)
                            }
                            loading={isUpdating}
                          />
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="text-text-muted hover:text-brand-gold transition-colors flex-shrink-0"
                            title="View order details"
                            aria-label={`View order #${shortId}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => updateParams({ page: params.page - 1 })}
            disabled={params.page <= 1}
            className="px-3 py-1.5 text-xs border border-neutral-border text-text-secondary hover:border-brand-gold transition-all rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-text-muted px-2">
            {params.page} / {pages}
          </span>
          <button
            onClick={() => updateParams({ page: params.page + 1 })}
            disabled={params.page >= pages}
            className="px-3 py-1.5 text-xs border border-neutral-border text-text-secondary hover:border-brand-gold transition-all rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}