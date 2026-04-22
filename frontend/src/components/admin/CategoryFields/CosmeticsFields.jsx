import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Purpose: Tag-input for cosmetics color families; Enter or comma commits a tag, Backspace removes the last one.
 * Input: profile – current cosmeticsProfile object, onChange – (updatedProfile) => void
 */
export default function CosmeticsFields({ profile, onChange }) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  /** Purpose: Normalises input to lowercase, deduplicates, and appends it to the colors list. */
  const commit = (raw) => {
    const color = raw.trim().toLowerCase();
    if (!color) return;
    const current = profile.colors ?? [];
    if (current.includes(color)) {
      setInput('');
      return;
    }
    onChange({ ...profile, colors: [...current, color] });
    setInput('');
  };

  /** Purpose: Removes a specific color tag from the colors list. */
  const remove = (color) => {
    onChange({ ...profile, colors: (profile.colors ?? []).filter((c) => c !== color) });
  };

  /** Purpose: Commits on Enter/comma; removes last tag on Backspace when the input is empty. */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(input);
    }
    if (e.key === 'Backspace' && !input && (profile.colors ?? []).length > 0) {
      const colors = profile.colors.slice();
      colors.pop();
      onChange({ ...profile, colors });
    }
  };

  const colorCount = (profile.colors ?? []).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] uppercase tracking-widest text-text-muted">
          {t('admin.cosmetics_fields.colors')}
          <span className="ml-2 text-text-muted normal-case tracking-normal">{t('admin.cosmetics_fields.optional')}</span>
        </label>
        {colorCount > 0 && (
          <span className="text-[11px] text-text-muted">
            {t('admin.cosmetics_fields.added', { count: colorCount })}
          </span>
        )}
      </div>

      {colorCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.colors.map((color) => (
            <span
              key={color}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-dark border border-neutral-border rounded-sm text-xs text-text-secondary"
            >
              {color}
              <button
                type="button"
                onClick={() => remove(color)}
                className="text-text-muted hover:text-red-400 transition-colors leading-none"
                aria-label={`Remove ${color}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(input)}
        placeholder={t('admin.cosmetics_fields.placeholder')}
        className="w-full bg-surface-dark border border-neutral-border rounded-sm px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors"
      />

      <p className="text-[11px] text-text-muted">
        {t('admin.cosmetics_fields.hint')}
      </p>
    </div>
  );
}
