// Accord keys — must match backend ACCORD_KEYS exactly.
const ACCORDS = [
  'woody', 'citrus', 'floral', 'oriental',
  'fresh', 'spicy',  'sweet',  'powdery',
];

/**
 * Renders 8 accord sliders (0–10) for a perfume product.
 *
 * @param {{ [key: string]: number }} profile  - Current accord values.
 * @param {function}                 onChange  - Called with the updated profile object.
 * @param {{ _root?: string }}       errors    - Validation errors.
 */
export default function PerfumeFields({ profile, onChange, errors }) {
  const handleAccord = (key, raw) => {
    const value = Math.min(10, Math.max(0, Number(raw)));
    onChange({ ...profile, [key]: value });
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-text-muted leading-relaxed">
        Set intensity for each accord (0 = absent, 10 = dominant).
        At least one must be above 0.
      </p>

      <div className="flex flex-col gap-4">
        {ACCORDS.map((key) => {
          const value = profile[key] ?? 0;
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-widest text-text-muted capitalize">
                  {key}
                </label>
                <span
                  className={`text-xs font-medium tabular-nums transition-colors ${
                    value > 0 ? 'text-brand-gold' : 'text-text-muted'
                  }`}
                >
                  {value}
                </span>
              </div>

              {/* Range + number input in sync */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={value}
                  onChange={(e) => handleAccord(key, e.target.value)}
                  className="flex-1 accent-brand-gold cursor-pointer"
                  aria-label={`${key} accord intensity`}
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={value}
                  onChange={(e) => handleAccord(key, e.target.value)}
                  className="w-12 bg-surface-dark border border-neutral-border rounded-sm px-2 py-1 text-xs text-center text-text-primary focus:outline-none focus:border-brand-gold transition-colors"
                  aria-label={`${key} accord value`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {errors._root && (
        <p className="text-xs text-red-500" role="alert">
          {errors._root}
        </p>
      )}
    </div>
  );
}
