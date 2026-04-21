import { Link } from 'react-router-dom';
import {
  ShoppingBag, Package, Users, DollarSign,
  Clock, ArrowRight, UserCheck, Award, TrendingUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAdminStats }     from '@/hooks/admin/useAdminStats';
import { useAdminAnalytics } from '@/hooks/admin/useAdminAnalytics';
import StatCard              from '@/components/admin/StatCard';
import OrderStatusBadge      from '@/components/admin/OrderStatusBadge';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function fillDates(data, days) {
  const map = Object.fromEntries((data || []).map((d) => [d.date, d]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const date = d.toISOString().slice(0, 10);
    return { date, count: 0, revenue: 0, ...map[date] };
  });
}

function shortDay(dateStr) {
  return new Date(`${dateStr}T12:00:00`)
    .toLocaleDateString('en-US', { weekday: 'short' });
}

function shortDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── AdminDashboardPage ───────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { stats, loading, error }                        = useAdminStats();
  const { analytics, loading: aLoading, error: aError } = useAdminAnalytics();

  return (
    <div className="flex flex-col gap-8 max-w-6xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-light text-text-primary tracking-wide">
          {t('admin.dashboard.title')}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {t('admin.dashboard.subtitle')}
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
          label={t('admin.dashboard.total_orders')}
          value={loading ? '—' : stats?.totalOrders?.toLocaleString() ?? '0'}
          loading={loading}
        />
        <StatCard
          icon={<DollarSign className="w-4 h-4" />}
          label={t('admin.dashboard.revenue')}
          value={
            loading
              ? '—'
              : `$${(stats?.totalRevenue ?? 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          sub={t('admin.dashboard.revenue_sub')}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label={t('admin.dashboard.pending_orders')}
          value={loading ? '—' : stats?.pendingOrders?.toLocaleString() ?? '0'}
          sub={t('admin.dashboard.pending_sub')}
          loading={loading}
        />
        <StatCard
          icon={<Package className="w-4 h-4" />}
          label={t('admin.dashboard.products')}
          value={loading ? '—' : stats?.totalProducts?.toLocaleString() ?? '0'}
          loading={loading}
        />
      </div>

      {/* ── Recent orders ────────────────────────────────────────────── */}
      <section aria-label={t('admin.dashboard.recent_orders')}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted">
            {t('admin.dashboard.recent_orders')}
          </h2>
          <Link
            to="/admin/orders"
            className="text-xs text-brand-gold hover:underline underline-offset-4 flex items-center gap-1"
          >
            {t('admin.dashboard.view_all')} <ArrowRight className="w-3 h-3" />
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
            {t('admin.dashboard.no_orders')}
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
      <section aria-label={t('admin.dashboard.quick_actions')}>
        <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-4">
          {t('admin.dashboard.quick_actions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink to="/admin/orders"   icon={<ShoppingBag className="w-4 h-4" />} label={t('admin.dashboard.manage_orders')} />
          <QuickLink to="/admin/products" icon={<Package     className="w-4 h-4" />} label={t('admin.dashboard.manage_products')} />
          <QuickLink to="/admin/users"    icon={<Users       className="w-4 h-4" />} label={t('admin.dashboard.manage_users')} />
        </div>
      </section>

      {/* ── Analytics ─────────────────────────────────────────────────── */}
      <section aria-label={t('admin.dashboard.analytics')}>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted whitespace-nowrap">
            {t('admin.dashboard.analytics')}
          </h2>
          <div
            className="flex-1 h-px"
            style={{ background: 'linear-gradient(90deg,rgba(212,175,55,0.25),transparent)' }}
            aria-hidden="true"
          />
        </div>

        {aError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 text-sm text-red-400">
            {aError}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConversionRateCard data={analytics?.conversionRate} loading={aLoading} />
              <MostActiveUserCard data={analytics?.mostActiveUser}  loading={aLoading} />
            </div>

            <TopProductsSection data={analytics?.topProductsByCategory} loading={aLoading} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BarChartCard
                title={t('admin.dashboard.weekly_sales')}
                subtitle={t('admin.dashboard.weekly_subtitle')}
                noDataText={t('admin.dashboard.no_data')}
                data={fillDates(analytics?.weeklySales, 7)}
                valueKey="count"
                loading={aLoading}
                showDayLabels
              />
              <BarChartCard
                title={t('admin.dashboard.user_growth')}
                subtitle={t('admin.dashboard.user_growth_subtitle')}
                noDataText={t('admin.dashboard.no_data')}
                data={fillDates(analytics?.userGrowth, 30)}
                valueKey="count"
                loading={aLoading}
                showEndDates
              />
            </div>

            <BarChartCard
              title={t('admin.dashboard.revenue_title')}
              subtitle={t('admin.dashboard.revenue_subtitle')}
              noDataText={t('admin.dashboard.no_data')}
              data={fillDates(analytics?.revenueOverTime, 30)}
              valueKey="revenue"
              loading={aLoading}
              formatValue={(v) =>
                `$${v.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
              showEndDates
            />
          </div>
        )}
      </section>

    </div>
  );
}

// ─── QuickLink ────────────────────────────────────────────────────────────────

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

// ─── ConversionRateCard ───────────────────────────────────────────────────────

function ConversionRateCard({ data, loading }) {
  const { t } = useTranslation();
  const rate = data?.rate ?? 0;
  return (
    <div className="bg-surface-card border border-neutral-border rounded-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <UserCheck className="w-4 h-4 text-text-muted" aria-hidden="true" />
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{t('admin.dashboard.conversion_rate')}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-8 w-20 bg-surface-dark rounded animate-pulse" />
          <div className="h-2 bg-surface-dark rounded animate-pulse" />
          <div className="h-3 w-44 bg-surface-dark rounded animate-pulse" />
        </div>
      ) : !data || data.totalUsers === 0 ? (
        <p className="text-sm text-text-muted py-2">{t('admin.dashboard.no_users')}</p>
      ) : (
        <>
          <p className="text-3xl font-light text-brand-gold mb-2">{rate}%</p>
          <div className="w-full bg-surface-dark rounded-full h-1.5 overflow-hidden mb-2">
            <div
              className="h-full bg-brand-gold rounded-full transition-all duration-700"
              style={{ width: `${rate}%` }}
            />
          </div>
          <p className="text-xs text-text-muted">
            {t('admin.dashboard.buyers_of', { buyers: data.buyers, total: data.totalUsers })}
          </p>
        </>
      )}
    </div>
  );
}

// ─── MostActiveUserCard ───────────────────────────────────────────────────────

function MostActiveUserCard({ data, loading }) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface-card border border-neutral-border rounded-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-text-muted" aria-hidden="true" />
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{t('admin.dashboard.most_active_buyer')}</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-36 bg-surface-dark rounded animate-pulse" />
          <div className="h-3 w-48 bg-surface-dark rounded animate-pulse" />
          <div className="h-8 w-16 bg-surface-dark rounded animate-pulse mt-3" />
        </div>
      ) : !data ? (
        <p className="text-sm text-text-muted py-2">{t('admin.dashboard.no_active_users')}</p>
      ) : (
        <>
          <p className="text-base font-medium text-text-primary truncate">{data.name}</p>
          <p className="text-xs text-text-muted mt-0.5 truncate">{data.email}</p>
          <p className="text-3xl font-light text-brand-gold mt-3">
            {data.orderCount}
            <span className="text-sm text-text-muted font-normal ml-1.5">{t('admin.dashboard.orders_count')}</span>
          </p>
        </>
      )}
    </div>
  );
}

// ─── TopProductsSection ───────────────────────────────────────────────────────

const CATEGORIES = ['perfume', 'skincare', 'cosmetics'];

function TopProductsSection({ data, loading }) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-text-muted" aria-hidden="true" />
        <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted">
          {t('admin.dashboard.top_sold')}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const product = data?.[cat];
          return (
            <div
              key={cat}
              className="bg-surface-card border border-neutral-border rounded-sm p-4"
            >
              <p className="text-[10px] uppercase tracking-widest text-brand-gold/70 mb-3">
                {t(`type.${cat}`)}
              </p>

              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-surface-dark rounded animate-pulse" />
                  <div className="h-3 w-20 bg-surface-dark rounded animate-pulse" />
                  <div className="h-7 w-16 bg-surface-dark rounded animate-pulse mt-2" />
                </div>
              ) : !product ? (
                <p className="text-xs text-text-muted py-1">{t('admin.dashboard.no_sales')}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-text-primary truncate">{product.name}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{product.brand}</p>
                  <p className="text-2xl font-light text-brand-gold mt-2">
                    {product.totalSold}
                    <span className="text-xs text-text-muted font-normal ml-1">{t('admin.dashboard.units_sold')}</span>
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BarChartCard ─────────────────────────────────────────────────────────────

function BarChartCard({
  title,
  subtitle,
  noDataText,
  data,
  valueKey,
  loading,
  formatValue,
  showDayLabels = false,
  showEndDates  = false,
}) {
  const hasData = (data || []).some((d) => (d[valueKey] ?? 0) > 0);
  const maxVal  = Math.max(...(data || []).map((d) => d[valueKey] ?? 0), 1);

  return (
    <div className="bg-surface-card border border-neutral-border rounded-sm p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-0.5">{title}</p>
      {subtitle && <p className="text-[11px] text-text-muted mb-4">{subtitle}</p>}

      {loading ? (
        <div className="h-28 bg-surface-dark rounded animate-pulse" />
      ) : !hasData ? (
        <div className="h-28 flex items-center justify-center">
          <p className="text-xs text-text-muted">{noDataText}</p>
        </div>
      ) : (
        <>
          <div className={`flex items-end gap-[2px] ${showDayLabels ? 'h-20' : 'h-28'}`}>
            {data.map((d, i) => {
              const val = d[valueKey] ?? 0;
              const pct = val > 0 ? Math.max(4, (val / maxVal) * 100) : 0;
              const tip = formatValue ? formatValue(val) : String(val);
              return (
                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                  <div
                    className="bg-brand-gold/60 hover:bg-brand-gold rounded-t-sm transition-colors duration-150 cursor-default"
                    style={{ height: `${pct}%` }}
                    title={`${d.date}: ${tip}`}
                  />
                </div>
              );
            })}
          </div>

          {showDayLabels && (
            <div className="flex gap-[2px] mt-1">
              {data.map((d, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[9px] text-text-muted leading-none">
                    {shortDay(d.date)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {showEndDates && data.length > 0 && (
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-text-muted">{shortDate(data[0].date)}</span>
              <span className="text-[9px] text-text-muted">{shortDate(data[data.length - 1].date)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
