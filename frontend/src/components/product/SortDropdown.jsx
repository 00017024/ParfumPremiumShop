import { useTranslation } from 'react-i18next';

export default function SortDropdown({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:w-48 bg-surface-card border border-neutral-border rounded-lg px-4 py-3 text-text-primary focus:border-brand-gold focus:outline-none transition-colors cursor-pointer"
    >
      <option value="createdAt-desc">{t('search.sort_newest')}</option>
      <option value="price-asc">{t('search.sort_price_asc')}</option>
      <option value="price-desc">{t('search.sort_price_desc')}</option>
    </select>
  );
}
