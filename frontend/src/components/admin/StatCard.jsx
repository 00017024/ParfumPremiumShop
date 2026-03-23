/**
 * A single metric tile for the admin dashboard overview.
 *
 * @param {ReactNode} icon      - Icon element (e.g. from lucide-react).
 * @param {string}    label     - Metric label.
 * @param {string}    value     - Metric value (already formatted).
 * @param {string}    [sub]     - Optional sub-label (e.g. trend or note).
 * @param {boolean}   [loading] - Renders a skeleton when true.
 */
export default function StatCard({ icon, label, value, sub, loading = false }) {
  if (loading) {
    return (
      <div className="bg-surface-card border border-neutral-border rounded-sm p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-surface-dark rounded-sm" />
          <div className="h-3 w-28 bg-surface-dark rounded" />
        </div>
        <div className="h-8 w-24 bg-surface-dark rounded mb-2" />
        <div className="h-3 w-20 bg-surface-dark rounded" />
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-neutral-border rounded-sm p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-gold/10 rounded-sm flex items-center justify-center flex-shrink-0">
          <span className="text-brand-gold">{icon}</span>
        </div>
        <span className="text-xs uppercase tracking-widest text-text-muted">
          {label}
        </span>
      </div>

      <p className="text-3xl font-light text-text-primary">{value}</p>

      {sub && (
        <p className="text-xs text-text-muted">{sub}</p>
      )}
    </div>
  );
}