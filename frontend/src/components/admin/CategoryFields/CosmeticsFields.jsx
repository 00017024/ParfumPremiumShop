import { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Tag input for cosmetics colors.
 * Press Enter or comma to add; click × to remove.
 * Colors are stored lowercase and deduplicated.
 *
 * @param {{ colors: string[] }} profile
 * @param {function}             onChange
 * @param {object}               errors   - unused for cosmetics (colors are optional)
 */
export default function CosmeticsFields({ profile, onChange, errors }) {
  const [input, setInput] = useState('');

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

  const remove = (color) => {
    onChange({ ...profile, colors: (profile.colors ?? []).filter((c) => c !== color) });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(input);
    }
    // Backspace on empty input removes last tag
    if (e.key === 'Backspace' && !input && (profile.colors ?? []).length > 0) {
      const colors = profile.colors.slice();
      colors.pop();
      onChange({ ...profile, colors });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] uppercase tracking-widest text-text-muted">
          Colors
          <span className="ml-2 text-text-muted normal-case tracking-normal">(optional)</span>
        </label>
        {(profile.colors ?? []).length > 0 && (
          <span className="text-[11px] text-text-muted">
            {profile.colors.length} added
          </span>
        )}
      </div>

      {/* Tag list */}
      {(profile.colors ?? []).length > 0 && (
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

      {/* Text input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(input)}
        placeholder="e.g. nude, red, coral — press Enter to add"
        className="w-full bg-surface-dark border border-neutral-border rounded-sm px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors"
      />

      <p className="text-[11px] text-text-muted">
        Press <kbd className="bg-surface-dark border border-neutral-border px-1 rounded text-[10px]">Enter</kbd> or{' '}
        <kbd className="bg-surface-dark border border-neutral-border px-1 rounded text-[10px]">,</kbd> to add.
        Backspace removes the last tag.
      </p>
    </div>
  );
}
