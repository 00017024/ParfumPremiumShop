import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Users,
  DollarSign,
  Clock,
  ArrowRight,
} from 'lucide-react';

import { useAdminStats } from '@/hooks/admin/useAdminStats';
import StatCard from '@/components/admin/StatCard';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';

export default function AdminDashboardPage() {
  const { stats, loading, error } = useAdminStats();

  return (
    <div className="flex flex-col gap-8 max-w-6xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-light text-text-primary tracking-wide">
          Dashboard
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Overview of your store's performance
        </p>
      </div>

      {/* ── Error state ─────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Stats grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingBag className="w-4 h-4" />}
          label="Total Orders"
          value={loading ? '—' : stats?.totalOrders?.toLocaleString() ?? '0'}
          loading={loading}
        />
        <StatCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Revenue"
          value={
            loading
              ? '—'
              : `$${(stats?.totalRevenue ?? 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          sub="Excluding cancelled orders"
          loading={loading}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Pending Orders"
          value={loading ? '—' : stats?.pendingOrders?.toLocaleString() ?? '0'}
          sub="Awaiting action"
          loading={loading}
        />
        <StatCard
          icon={<Package className="w-4 h-4" />}
          label="Products"
          value={loading ? '—' : stats?.totalProducts?.toLocaleString() ?? '0'}
          loading={loading}
        />
      </div>

      {/* ── Recent orders ────────────────────────────────────────────── */}
      <section aria-label="Recent orders">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-xs text-brand-gold hover:underline underline-offset-4 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="bg-surface-card border border-neutral-border rounded-sm divide-y divide-neutral-border animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-32 bg-surface-dark rounded" />
                  <div className="h-2.5 w-24 bg-surface-dark rounded" />
                </div>
                <div className="h-3 w-16 bg-surface-dark rounded" />
              </div>
            ))}
          </div>
        ) : !stats?.recentOrders?.length ? (
          <div className="bg-surface-card border border-neutral-border rounded-sm py-10 text-center text-sm text-text-muted">
            No orders yet.
          </div>
        ) : (
          <div className="bg-surface-card border border-neutral-border rounded-sm divide-y divide-neutral-border overflow-hidden">
            {stats.recentOrders.map((order) => {
              const shortId = order._id.slice(-6).toUpperCase();
              const date = new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });
              return (
                <Link
                  key={order._id}
                  to={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-dark transition-colors group"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-text-primary group-hover:text-brand-gold transition-colors">
                      #{shortId}
                    </span>
                    <span className="text-xs text-text-muted">{date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-brand-gold">
                      ${Number(order.totalPrice).toFixed(2)}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Quick links ──────────────────────────────────────────────── */}
      <section aria-label="Quick actions">
        <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink to="/admin/orders" icon={<ShoppingBag className="w-4 h-4" />} label="Manage Orders" />
          <QuickLink to="/admin/products" icon={<Package className="w-4 h-4" />} label="Manage Products" />
          <QuickLink to="/admin/users" icon={<Users className="w-4 h-4" />} label="Manage Users" />
        </div>
      </section>

    </div>
  );
}

function QuickLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-surface-card border border-neutral-border rounded-sm px-4 py-3 hover:border-brand-gold/40 hover:bg-surface-dark transition-all group"
    >
      <span className="text-text-muted group-hover:text-brand-gold transition-colors">
        {icon}
      </span>
      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
        {label}
      </span>
      <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-brand-gold transition-colors ml-auto" />
    </Link>
  );
}