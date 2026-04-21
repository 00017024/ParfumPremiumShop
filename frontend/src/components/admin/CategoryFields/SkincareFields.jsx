import { useTranslation } from 'react-i18next';

const SKIN_TYPES = ['dry', 'oily', 'combination', 'normal', 'sensitive'];

const INGREDIENTS = [
  'aloe vera',
  'snail mucin',
  'collagen',
  'hyaluronic acid',
  'salicylic acid',
  'niacinamide',
  'vitamin C',
  'retinol',
];

const INGREDIENT_KEY_MAP = {
  'aloe vera':      'aloe_vera',
  'snail mucin':    'snail_mucin',
  'collagen':       'collagen',
  'hyaluronic acid':'hyaluronic_acid',
  'salicylic acid': 'salicylic_acid',
  'niacinamide':    'niacinamide',
  'vitamin C':      'vitamin_c',
  'retinol':        'retinol',
};

export default function SkincareFields({ profile, onChange, errors }) {
  const { t } = useTranslation();

  const toggle = (field, value) => {
    const current = profile[field] ?? [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...profile, [field]: updated });
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Skin Types (optional) ─────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        <label className="text-[11px] uppercase tracking-widest text-text-muted">
          {t('admin.skincare_fields.skin_types')}
          <span className="ml-2 text-text-muted normal-case tracking-normal">{t('admin.skincare_fields.optional')}</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SKIN_TYPES.map((type) => {
            const active = (profile.skinTypes ?? []).includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggle('skinTypes', type)}
                className={`px-3 py-1.5 text-xs rounded-sm border transition-colors capitalize ${
                  active
                    ? 'bg-brand-gold text-brand-black border-brand-gold'
                    : 'border-neutral-border text-text-muted hover:border-brand-gold hover:text-text-secondary'
                }`}
                aria-pressed={active}
              >
                {t(`skin_type.${type}`, { defaultValue: type })}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Ingredients (required, min 1) ─────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        <label className="text-[11px] uppercase tracking-widest text-text-muted">
          {t('admin.skincare_fields.ingredients')}
          <span className="text-brand-gold ml-1">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {INGREDIENTS.map((ing) => {
            const active = (profile.ingredients ?? []).includes(ing);
            const key = INGREDIENT_KEY_MAP[ing] ?? ing;
            return (
              <button
                key={ing}
                type="button"
                onClick={() => toggle('ingredients', ing)}
                className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${
                  active
                    ? 'bg-brand-gold text-brand-black border-brand-gold'
                    : 'border-neutral-border text-text-muted hover:border-brand-gold hover:text-text-secondary'
                }`}
                aria-pressed={active}
              >
                {t(`ingredient.${key}`, { defaultValue: ing })}
              </button>
            );
          })}
        </div>
        {errors.ingredients && (
          <p className="text-xs text-red-500" role="alert">
            {errors.ingredients}
          </p>
        )}
      </div>

    </div>
  );
}
