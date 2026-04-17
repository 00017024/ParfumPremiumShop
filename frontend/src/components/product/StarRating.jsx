import { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating
 *
 * Display mode  — omit `onChange`. Renders average rating (decimal → rounded stars).
 * Interactive   — provide `onChange`. Clickable stars with hover preview.
 *
 * Props:
 *   value      {number}                   Average rating 0–5 (decimal ok)
 *   count      {number}                   Total number of ratings
 *   onChange   {(n: number) => void}      Present → interactive mode
 *   userRating {number | null}            User's already-submitted rating
 *   disabled   {boolean}                  True while the parent is submitting
 *   size       {'sm' | 'md'}              Star size (default 'sm')
 */
export default function StarRating({
  value      = 0,
  count      = 0,
  onChange,
  userRating = null,
  disabled   = false,
  size       = 'sm',
}) {
  const [hovered, setHovered] = useState(0);
  // Briefly true right after a successful save — shows "Saved" and blocks re-click
  const [saved, setSaved] = useState(false);
  const prevDisabled = useRef(false);

  const isInteractive = !!onChange;

  // Detect when `disabled` flips from true → false (submission just completed).
  // Show a short "Saved" confirmation to prevent double-clicks and improve clarity.
  useEffect(() => {
    if (prevDisabled.current && !disabled && isInteractive) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 1500);
      return () => clearTimeout(t);
    }
    prevDisabled.current = disabled;
  }, [disabled, isInteractive]);

  // Block interaction while submitting OR during the brief post-save window
  const isBlocked = disabled || saved;

  // Stars to highlight:
  //   interactive → live hover  >  already-submitted rating  >  nothing
  //   display     → Math.round(average)
  const activeStars = isInteractive
    ? (hovered > 0 ? hovered : (userRating ?? 0))
    : Math.round(value);

  const starSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  // ── Label text ──────────────────────────────────────────────────────────────
  let label;
  if (saved) {
    label = 'Saved';
  } else if (count === 0) {
    label = 'No ratings yet';
  } else {
    label = `${Number(value).toFixed(1)} (${count})`;
  }

  return (
    <div className="flex items-center gap-2">

      {/* Stars row */}
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => isInteractive && !isBlocked && setHovered(0)}
        role={isInteractive ? 'group' : undefined}
        aria-label={
          isInteractive
            ? 'Rate this product'
            : count > 0
              ? `Rated ${Number(value).toFixed(1)} out of 5`
              : 'No ratings yet'
        }
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isInteractive || isBlocked}
            onClick={() => isInteractive && !isBlocked && onChange(star)}
            onMouseEnter={() => isInteractive && !isBlocked && setHovered(star)}
            aria-label={isInteractive ? `Rate ${star} out of 5` : undefined}
            className={[
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold rounded-sm',
              isInteractive && !isBlocked
                ? 'cursor-pointer hover:scale-110 transition-transform duration-100'
                : 'cursor-default',
            ].join(' ')}
          >
            <Star
              aria-hidden="true"
              className={[
                starSize,
                'transition-colors duration-150',
                star <= activeStars
                  ? 'fill-brand-gold text-brand-gold'
                  : 'fill-transparent text-neutral-border',
              ].join(' ')}
            />
          </button>
        ))}
      </div>

      {/* Label */}
      <span
        className={[
          'text-xs leading-none select-none transition-colors duration-300',
          saved ? 'text-green-500' : 'text-text-muted',
        ].join(' ')}
      >
        {label}
      </span>

    </div>
  );
}
