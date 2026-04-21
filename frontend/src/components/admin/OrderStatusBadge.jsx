import { useTranslation } from 'react-i18next';

const STATUS_CLASSES = {
  PENDING:   'bg-brand-gold/15 text-brand-gold border border-brand-gold/30',
  PAID:      'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  CONFIRMED: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  COMPLETED: 'bg-green-500/15 text-green-400 border border-green-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

export default function OrderStatusBadge({ status }) {
  const { t } = useTranslation();
  const classes = STATUS_CLASSES[status] ?? 'bg-neutral-700 text-text-muted border border-neutral-600';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider whitespace-nowrap ${classes}`}
    >
      {t(`admin.status.${status}`, { defaultValue: status })}
    </span>
  );
}
