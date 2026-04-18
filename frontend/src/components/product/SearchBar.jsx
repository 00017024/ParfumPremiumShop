import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SearchBar({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="relative flex-1">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
      <input
        type="text"
        placeholder={t('search.placeholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-card border border-neutral-border rounded-lg pl-12 pr-4 py-3 text-text-primary placeholder-text-muted focus:border-brand-gold focus:outline-none transition-colors"
      />
    </div>
  );
}
