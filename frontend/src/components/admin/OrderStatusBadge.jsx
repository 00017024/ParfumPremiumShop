/**
 * Consistent status badge across all admin order views.
 * Matches the design language used in the user-facing MyOrdersPage.
 */

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   classes: 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30' },
  PAID:      { label: 'Paid',      classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  CONFIRMED: { label: 'Confirmed', classes: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  COMPLETED: { label: 'Completed', classes: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  CANCELLED: { label: 'Cancelled', classes: 'bg-red-500/15 text-red-400 border border-red-500/30' },
};

export default function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    classes: 'bg-neutral-700 text-text-muted border border-neutral-600',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider whitespace-nowrap ${config.classes}`}
    >
      {config.label}
    </span>
  );
}