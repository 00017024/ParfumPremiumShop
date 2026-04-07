import { useState } from 'react';

// ─── Domain constants (mirror backend schema field names exactly) ──────────────

const ACCORD_FIELDS = [
  { key: 'woody',   label: 'Woody'   },
  { key: 'musky',   label: 'Musky'   },
  { key: 'sweet',   label: 'Sweet'   },
  { key: 'citrus',  label: 'Citrus'  },
  { key: 'floral',  label: 'Floral'  },
  { key: 'spicy',   label: 'Spicy'   },
  { key: 'powdery', label: 'Powdery' },
  { key: 'fresh',   label: 'Fresh'   },
];

const SKIN_TYPES  = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
const INGREDIENTS = [
  'aloe vera', 'snail mucin', 'collagen', 'hyaluronic acid',
  'salicylic acid', 'niacinamide', 'vitamin C', 'retinol',
];
const COLOR_FAMILIES = ['nude', 'red', 'pink', 'brown', 'coral'];
const COLOR_SWATCHES  = {
  nude: '#C4A882', red: '#C0392B', pink: '#E91E8C', brown: '#8B4513', coral: '#FF7F50',
};

const DEFAULT_ACCORDS = Object.fromEntries(ACCORD_FIELDS.map(({ key }) => [key, 0]));

// ─── Helper ───────────────────────────────────────────────────────────────────

function toggle(list, item) {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 text-xs rounded-sm border transition-colors capitalize ${
        active
          ? 'bg-brand-gold text-brand-black border-brand-gold'
          : 'border-neutral-border text-text-muted hover:border-brand-gold hover:text-text-secondary'
      }`}
    >
      {label}
    </button>
  );
}

// ─── FilterPanel ──────────────────────────────────────────────────────────────

/**
 * @param {{ onApply: (config: object) => void, onClear: () => void }} props
 */
export default function FilterPanel({ onApply, onClear }) {
  const [type, setType]               = useState('perfume');
  const [accords, setAccords]         = useState(DEFAULT_ACCORDS);
  const [skinTypes, setSkinTypes]     = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [colorFams, setColorFams]     = useState([]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setAccords(DEFAULT_ACCORDS);
    setSkinTypes([]);
    setIngredients([]);
    setColorFams([]);
  };

  const handleApply = () => {
    if (type === 'perfume') {
      // Only send accords the user actually adjusted (> 0)
      const activeAccords = Object.fromEntries(
        Object.entries(accords).filter(([, v]) => v > 0)
      );
      onApply({ type: 'perfume', params: activeAccords });
    } else if (type === 'skincare') {
      onApply({ type: 'skincare', params: { skinTypes, ingredients } });
    } else {
      onApply({ type: 'cosmetics', params: { colors: colorFams } });
    }
  };

  const handleClear = () => {
    setAccords(DEFAULT_ACCORDS);
    setSkinTypes([]);
    setIngredients([]);
    setColorFams([]);
    onClear();
  };

  return (
    <div className="bg-surface-card border border-neutral-border rounded-sm p-5 space-y-5">

      {/* ── Product type tabs ──────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-3">
          Product Type
        </p>
        <div className="flex gap-2 flex-wrap">
          {['perfume', 'skincare', 'cosmetics'].map((t) => (
            <ToggleChip
              key={t}
              label={t}
              active={type === t}
              onClick={() => handleTypeChange(t)}
            />
          ))}
        </div>
      </div>

      {/* ── Perfume: accord sliders ────────────────────────────────────────── */}
      {type === 'perfume' && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-text-muted">
            Accord Preferences
          </p>
          {ACCORD_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-16 shrink-0">{label}</span>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={accords[key]}
                onChange={(e) =>
                  setAccords((prev) => ({ ...prev, [key]: parseInt(e.target.value, 10) }))
                }
                className="flex-1 accent-brand-gold h-1 cursor-pointer"
                aria-label={`${label} intensity`}
              />
              <span
                className={`text-xs w-4 text-right shrink-0 ${
                  accords[key] > 0 ? 'text-brand-gold' : 'text-text-muted'
                }`}
              >
                {accords[key]}
              </span>
            </div>
          ))}
          <p className="text-[11px] text-text-muted pt-1">
            Accords left at 0 are excluded from matching.
          </p>
        </div>
      )}

      {/* ── Skincare: skin types + ingredients ────────────────────────────── */}
      {type === 'skincare' && (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">
              Skin Type
            </p>
            <div className="flex flex-wrap gap-2">
              {SKIN_TYPES.map((t) => (
                <ToggleChip
                  key={t}
                  label={t}
                  active={skinTypes.includes(t)}
                  onClick={() => setSkinTypes((prev) => toggle(prev, t))}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">
              Ingredients
            </p>
            <div className="flex flex-wrap gap-2">
              {INGREDIENTS.map((ing) => (
                <ToggleChip
                  key={ing}
                  label={ing}
                  active={ingredients.includes(ing)}
                  onClick={() => setIngredients((prev) => toggle(prev, ing))}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Cosmetics: color family ────────────────────────────────────────── */}
      {type === 'cosmetics' && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">
            Color Family
          </p>
          <div className="flex flex-wrap gap-2">
            {COLOR_FAMILIES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColorFams((prev) => toggle(prev, color))}
                aria-pressed={colorFams.includes(color)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-sm border transition-colors capitalize ${
                  colorFams.includes(color)
                    ? 'border-brand-gold text-text-primary'
                    : 'border-neutral-border text-text-muted hover:border-brand-gold hover:text-text-secondary'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/10"
                  style={{ background: COLOR_SWATCHES[color] }}
                  aria-hidden="true"
                />
                {color}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Leave empty to show all cosmetics products.
          </p>
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2 border-t border-neutral-border">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-xs text-text-secondary border border-neutral-border hover:border-text-secondary hover:text-text-primary transition-colors rounded-sm"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 px-4 py-2 text-xs font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 transition-all rounded-sm"
        >
          Apply Filters
        </button>
      </div>

    </div>
  );
}
