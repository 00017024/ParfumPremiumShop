import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Purpose: Centered empty-state placeholder with a box icon; uses i18n defaults when no message/description is passed.
 */
export default function EmptyState({ message, description }) {
  const { t } = useTranslation();
  const msg  = message     ?? t('empty.default_message');
  const desc = description ?? t('empty.default_description');

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Package className="w-16 h-16 text-text-muted mb-4" />
      <h3 className="text-2xl font-semibold text-text-primary mb-2">
        {msg}
      </h3>
      <p className="text-text-secondary text-center max-w-md">
        {desc}
      </p>
    </div>
  );
}
