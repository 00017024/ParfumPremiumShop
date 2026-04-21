import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import PerfumeFields  from './CategoryFields/PerfumeFields';
import SkincareFields from './CategoryFields/SkincareFields';
import CosmeticsFields from './CategoryFields/CosmeticsFields';

// ─── Default profile shapes ───────────────────────────────────────────────────
// Keys must match backend schema exactly.

const DEFAULT_PROFILES = {
  perfume:   { woody: 0, citrus: 0, floral: 0, oriental: 0, fresh: 0, spicy: 0, sweet: 0, powdery: 0 },
  skincare:  { skinTypes: [], ingredients: [] },
  cosmetics: { colors: [] },
};

// ─── Frontend mirrors of backend validation rules ─────────────────────────────

const ACCORD_KEYS = ['woody', 'citrus', 'floral', 'oriental', 'fresh', 'spicy', 'sweet', 'powdery'];

function validateProfile(type, profile, t) {
  const errors = {};

  if (type === 'perfume') {
    const hasAccord = ACCORD_KEYS.some((k) => (profile[k] ?? 0) > 0);
    if (!hasAccord) {
      errors._root = t('admin.perfume_fields.error');
    }
  }

  if (type === 'skincare') {
    if (!(profile.ingredients?.length > 0)) {
      errors.ingredients = t('admin.skincare_fields.error');
    }
  }

  // cosmetics — no required fields
  return errors;
}

// ─── Field component map ──────────────────────────────────────────────────────

const FIELD_COMPONENTS = {
  perfume:   PerfumeFields,
  skincare:  SkincareFields,
  cosmetics: CosmeticsFields,
};

// ─── CategoryModal ────────────────────────────────────────────────────────────

/**
 * Secondary modal for configuring a category-specific product profile.
 * Rendered at z-[60] so it stacks above the primary ProductFormModal (z-50).
 *
 * @param {boolean}      open            - Whether the modal is visible.
 * @param {string}       type            - "perfume" | "skincare" | "cosmetics"
 * @param {object|null}  initialProfile  - Existing profile to pre-populate, or null.
 * @param {function}     onApply         - Called with the validated profile object.
 * @param {function}     onClose         - Called to close without saving.
 */
export default function CategoryModal({ open, type, initialProfile, onApply, onClose }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(DEFAULT_PROFILES[type] ?? {});
  const [errors,  setErrors]  = useState({});

  // Reset local state whenever the modal opens or the type changes.
  useEffect(() => {
    if (!open) return;
    // Merge stored profile on top of defaults so all keys are always present.
    const merged = { ...(DEFAULT_PROFILES[type] ?? {}), ...(initialProfile ?? {}) };
    setProfile(merged);
    setErrors({});
  }, [open, type]); // intentionally excludes initialProfile — only re-init on open/type change

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open || !type) return null;

  const FieldComponent = FIELD_COMPONENTS[type];

  // ── REQ 1: live perfume validation ────────────────────────────────────────
  // Computed from current profile state on every render, not only after a
  // failed Apply. This drives both the inline error message and Apply's
  // disabled state so the user gets feedback as they adjust sliders.
  const allAccordsZero =
    type === 'perfume' && ACCORD_KEYS.every((k) => (profile[k] ?? 0) === 0);

  // For perfume: replace _root with the live-computed value so the error
  // appears immediately, not only after a submit attempt.
  // For other types: fall through to submit-time errors as before.
  const displayErrors =
    type === 'perfume'
      ? { ...errors, _root: allAccordsZero ? t('admin.perfume_fields.error') : undefined }
      : errors;

  const handleApply = () => {
    const errs = validateProfile(type, profile, t);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onApply(profile);
    // onClose is called by the parent after onApply resolves.
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      {/* Backdrop — clicking closes without applying */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="relative bg-surface-card border border-neutral-border rounded-sm shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">

        {/* ── Header (sticky) ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-border flex-shrink-0">
          <h3
            id="category-modal-title"
            className="text-sm uppercase tracking-[0.2em] text-text-primary"
          >
            {t(`admin.category_modal.${type}_title`)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label={t('admin.category_modal.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable content ───────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <FieldComponent
            profile={profile}
            onChange={setProfile}
            errors={displayErrors}
          />
        </div>

        {/* ── Actions (sticky footer) ──────────────────────────────────── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary border border-neutral-border hover:border-text-secondary transition-colors rounded-sm"
          >
            {t('admin.category_modal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={allAccordsZero}
            className="px-5 py-2 text-sm font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('admin.category_modal.apply')}
          </button>
        </div>

      </div>
    </div>
  );
}
