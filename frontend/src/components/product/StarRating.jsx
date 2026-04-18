import { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(0);
  const [saved, setSaved] = useState(false);
  const prevDisabled = useRef(false);

  const isInteractive = !!onChange;

  useEffect(() => {
    if (prevDisabled.current && !disabled && isInteractive) {
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 1500);
      return () => clearTimeout(timer);
    }
    prevDisabled.current = disabled;
  }, [disabled, isInteractive]);

  const isBlocked = disabled || saved;

  const activeStars = isInteractive
    ? (hovered > 0 ? hovered : (userRating ?? 0))
    : Math.round(value);

  const starSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  let label;
  if (saved) {
    label = t('product.saved');
  } else if (count === 0) {
    label = t('product.no_ratings');
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
            ? t('product.rate_product')
            : count > 0
              ? t('product.rated_out_of', { value: Number(value).toFixed(1) })
              : t('product.no_ratings')
        }
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isInteractive || isBlocked}
            onClick={() => isInteractive && !isBlocked && onChange(star)}
            onMouseEnter={() => isInteractive && !isBlocked && setHovered(star)}
            aria-label={isInteractive ? t('product.rate_star', { star }) : undefined}
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
