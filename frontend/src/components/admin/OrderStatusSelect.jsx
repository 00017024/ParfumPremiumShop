import { Loader2 } from 'lucide-react';

/**
 * Valid transitions mirrored from the backend ORDER_TRANSITIONS map.
 * The backend is the source of truth and will reject invalid transitions —
 * this map is here purely for UX (hiding invalid options).
 */
const TRANSITIONS = {
  PENDING:   ['PAID', 'CANCELLED'],
  PAID:      ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

const ALL_STATUSES = ['PENDING', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

/**
 * A select dropdown that only offers valid next-state transitions.
 * Shows a spinner inline while the update is in-flight.
 *
 * @param {string}   currentStatus  - The order's current status.
 * @param {function} onChange       - Called with the new status string.
 * @param {boolean}  loading        - Whether an update is in-flight.
 */
export default function OrderStatusSelect({ currentStatus, onChange, loading = false }) {
  const allowed = TRANSITIONS[currentStatus] ?? [];
  const hasTransitions = allowed.length > 0;

  if (!hasTransitions) {
    return (
      <span className="text-xs text-text-muted italic">
        No further transitions
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value=""
        disabled={loading}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        className="bg-surface-dark border border-neutral-border text-text-primary text-sm rounded-sm px-3 py-1.5 focus:outline-none focus:border-brand-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Change order status"
      >
        <option value="" disabled>
          Move to…
        </option>
        {allowed.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {loading && (
        <Loader2 className="w-4 h-4 text-brand-gold animate-spin flex-shrink-0" aria-hidden="true" />
      )}
    </div>
  );
}