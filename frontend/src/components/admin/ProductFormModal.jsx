import { useState, useEffect } from 'react';
import { X, Loader2, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import CategoryModal from './CategoryModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_TYPES = ['perfume', 'skincare', 'cosmetics'];

/**
 * Maps each product `type` to its profile field name in the backend schema.
 * Backend uses: scentProfile (not perfumeProfile), skincareProfile, cosmeticsProfile.
 */
const PROFILE_KEY = {
  perfume:   'scentProfile',
  skincare:  'skincareProfile',
  cosmetics: 'cosmeticsProfile',
};

const EMPTY_BASE = {
  name:        '',
  brand:       '',
  price:       '',
  stock:       '',
  description: '',
  imageUrl:    '',
  categories:  '',  // comma-separated; split on submit
};

// ─── Backend error mapping ────────────────────────────────────────────────────
//
// Maps Joi detail strings from the backend into field-level errors that can
// be shown inline next to the offending input, and collects anything that
// doesn't match a known field into a general-purpose array.
//
// Backend detail format:  '"name" is required'  |  '"price" must be ...'
// Match strategy: keyword check on the lowercased message, first match wins.

const DETAIL_FIELD_KEYWORDS = [
  ['name',     ['"name"']],
  ['brand',    ['"brand"']],
  ['price',    ['"price"']],
  ['stock',    ['"stock"']],
  ['imageUrl', ['"imageurl"', 'image url']],
  ['type',     ['"type"']],
];

function mapDetailsToErrors(details = []) {
  const fieldErrors = {};
  const general     = [];

  for (const msg of details) {
    const lower   = msg.toLowerCase();
    let   matched = false;

    for (const [field, keywords] of DETAIL_FIELD_KEYWORDS) {
      if (keywords.some((k) => lower.includes(k))) {
        // Keep the first error per field.
        if (!fieldErrors[field]) fieldErrors[field] = msg;
        matched = true;
        break;
      }
    }

    if (!matched) general.push(msg);
  }

  return { fieldErrors, general };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateBase(form, productType, isEditing) {
  const errors = {};

  if (!form.name.trim() || form.name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters.';

  if (!form.brand.trim())
    errors.brand = 'Brand is required.';

  if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0)
    errors.price = 'Price must be a non-negative number.';

  if (form.stock !== '' && (isNaN(Number(form.stock)) || Number(form.stock) < 0))
    errors.stock = 'Stock must be a non-negative integer.';

  if (form.imageUrl && !/^https?:\/\/.+/.test(form.imageUrl.trim()))
    errors.imageUrl = 'Image URL must start with http:// or https://';

  // type required only on create; update can leave it unchanged
  if (!isEditing && !productType)
    errors.type = 'Product type is required.';

  return errors;
}

// ─── Profile summary label ────────────────────────────────────────────────────

function profileSummary(type, profile) {
  if (!profile) return null;

  if (type === 'perfume') {
    const ACCORDS = ['woody', 'citrus', 'floral', 'oriental', 'fresh', 'spicy', 'sweet', 'powdery'];
    const active  = ACCORDS.filter((k) => (profile[k] ?? 0) > 0);
    return active.length > 0 ? active.join(', ') : null;
  }
  if (type === 'skincare') {
    return profile.ingredients?.length > 0
      ? `${profile.ingredients.length} ingredient${profile.ingredients.length !== 1 ? 's' : ''}`
      : null;
  }
  if (type === 'cosmetics') {
    return profile.colors?.length > 0
      ? `${profile.colors.length} color${profile.colors.length !== 1 ? 's' : ''}`
      : 'No colors set';
  }
  return null;
}

// ─── ProductFormModal ─────────────────────────────────────────────────────────

/**
 * Modal for creating or editing a product (base fields + optional category profile).
 *
 * The `type` field drives which category profile is collected.
 * Only the matching profile key is included in the submitted payload —
 * never multiple, never an empty object.
 *
 * @param {boolean}      open        - Whether the modal is visible.
 * @param {object|null}  product     - Existing product to edit, or null to create.
 * @param {boolean}      submitting  - Whether the save action is in-flight.
 * @param {function}     onSave      - Called with the validated payload object.
 * @param {function}     onClose     - Called to close the modal.
 */
export default function ProductFormModal({
  open,
  product = null,
  submitting = false,
  onSave,
  onClose,
}) {
  const isEditing = Boolean(product);

  // ── Base field state ─────────────────────────────────────────────────────
  const [form, setForm]             = useState(EMPTY_BASE);
  // ── Type discriminator ───────────────────────────────────────────────────
  const [productType, setProductType] = useState('');
  // ── Profile data — only one exists at a time ─────────────────────────────
  const [profile, setProfile]       = useState(null);
  // ── CategoryModal open/close ─────────────────────────────────────────────
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  // ── Client-side field validation errors ──────────────────────────────────
  const [errors, setErrors]         = useState({});
  // ── Server error details that couldn't be mapped to a specific field ──────
  const [serverErrors, setServerErrors] = useState([]);

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (!open) return;

    if (product) {
      setForm({
        name:        product.name        ?? '',
        brand:       product.brand       ?? '',
        price:       product.price?.toString()  ?? '',
        stock:       product.stock?.toString()  ?? '',
        description: product.description ?? '',
        imageUrl:    product.imageUrl    ?? '',
        categories:  (product.categories ?? []).join(', '),
      });

      const type = product.type ?? '';
      setProductType(type);

      // Load the profile that matches this product's type, if any.
      const key = PROFILE_KEY[type];
      setProfile(key && product[key] ? { ...product[key] } : null);
    } else {
      setForm(EMPTY_BASE);
      setProductType('');
      setProfile(null);
    }

    setErrors({});
    setServerErrors([]);
  }, [product, open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      // Don't intercept Escape when the profile sub-modal is open
      if (!profileModalOpen && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, profileModalOpen, onClose]);

  if (!open) return null;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleTypeChange = (e) => {
    const next = e.target.value;
    setProductType(next);
    // Switching type discards the previous profile — a profile for "perfume"
    // is not valid for "skincare" and must not be sent.
    setProfile(null);
    if (errors.type) setErrors((prev) => ({ ...prev, type: undefined }));
  };

  const handleProfileApply = (validatedProfile) => {
    setProfile(validatedProfile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErrors([]);

    // ── Client-side validation first — no request sent if this fails ───────
    const validationErrors = validateBase(form, productType, isEditing);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // ── Payload construction ───────────────────────────────────────────────
    // Only include fields the backend schema knows about.
    // Never send two profiles; never send an empty profile object.

    const payload = {
      name:  form.name.trim(),
      brand: form.brand.trim(),
      price: Number(form.price),
      stock: form.stock !== '' ? parseInt(form.stock, 10) : 0,
    };

    if (form.description.trim()) payload.description = form.description.trim();
    if (form.imageUrl.trim())    payload.imageUrl    = form.imageUrl.trim();

    const tags = form.categories.split(',').map((c) => c.trim()).filter(Boolean);
    if (tags.length > 0) payload.categories = tags;

    // Attach type discriminator and the single matching profile key.
    if (productType) {
      payload.type = productType;

      if (profile) {
        const profileKey = PROFILE_KEY[productType];
        payload[profileKey] = profile;
      }
    }

    // ── API call — result is { success, product? } or { success: false, message, details } ──
    const result = await onSave(payload);

    // onSave succeeded (or parent doesn't return — treat as success).
    if (!result || result.success) return;

    // ── Map backend details[] to inline field errors ───────────────────────
    const { fieldErrors, general } = mapDetailsToErrors(result.details ?? []);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
    }

    // Unmapped details + catch-all fallback go to the server error banner.
    if (general.length > 0) {
      setServerErrors(general);
    } else if (Object.keys(fieldErrors).length === 0) {
      // Nothing mapped at all — show the top-level message as a banner.
      setServerErrors([result.message || 'An unexpected error occurred.']);
    }
  };

  // ── Styles helpers ───────────────────────────────────────────────────────

  const inputClass = (field) =>
    `w-full bg-surface-dark border rounded-sm px-3 py-2.5 text-sm text-text-primary
     placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors
     ${errors[field] ? 'border-red-500' : 'border-neutral-border'}`;

  const summary = productType ? profileSummary(productType, profile) : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70"
          onClick={() => { if (!submitting) onClose(); }}
          aria-hidden="true"
        />

        {/* Panel */}
        <div className="relative bg-surface-card border border-neutral-border rounded-sm shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

          {/* ── Header ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-border">
            <h2
              id="product-form-title"
              className="text-sm uppercase tracking-[0.2em] text-text-primary"
            >
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Form ──────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="px-6 py-5 flex flex-col gap-5">

            {/* Server-side errors that couldn't be mapped to a specific field */}
            {serverErrors.length > 0 && (
              <div
                role="alert"
                className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 flex flex-col gap-1"
              >
                {serverErrors.map((msg, i) => (
                  <p key={i} className="text-xs text-red-400">{msg}</p>
                ))}
              </div>
            )}

            {/* Name */}
            <Field label="Product Name" required error={errors.name}>
              <input
                type="text"
                placeholder="e.g. Chanel No. 5"
                value={form.name}
                onChange={handleChange('name')}
                className={inputClass('name')}
              />
            </Field>

            {/* Brand */}
            <Field label="Brand" required error={errors.brand}>
              <input
                type="text"
                placeholder="e.g. Chanel"
                value={form.brand}
                onChange={handleChange('brand')}
                className={inputClass('brand')}
              />
            </Field>

            {/* Price + Stock */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (USD)" required error={errors.price}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={handleChange('price')}
                  className={inputClass('price')}
                />
              </Field>
              <Field label="Stock" error={errors.stock}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.stock}
                  onChange={handleChange('stock')}
                  className={inputClass('stock')}
                />
              </Field>
            </div>

            {/* Image URL */}
            <Field label="Image URL" error={errors.imageUrl}>
              <input
                type="url"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={handleChange('imageUrl')}
                className={inputClass('imageUrl')}
              />
            </Field>

            {/* Categories (legacy free-form tags) */}
            <Field label="Tags" error={errors.categories}>
              <input
                type="text"
                placeholder="floral, woody, citrus (comma separated)"
                value={form.categories}
                onChange={handleChange('categories')}
                className={inputClass('categories')}
              />
            </Field>

            {/* ── Product Type + Profile ─────────────────────────────── */}
            <div className="flex flex-col gap-3 pt-1 border-t border-neutral-border">
              <p className="text-[11px] uppercase tracking-widest text-text-muted pt-1">
                Product Type & Profile
              </p>

              {/* Type select + Specify button — inline row */}
              <div className="flex gap-3 items-start">
                <Field
                  label={isEditing ? 'Type' : 'Type'}
                  required={!isEditing}
                  error={errors.type}
                  className="flex-1"
                >
                  <select
                    value={productType}
                    onChange={handleTypeChange}
                    className={`w-full bg-surface-dark border rounded-sm px-3 py-2.5 text-sm
                      focus:outline-none focus:border-brand-gold transition-colors appearance-none
                      ${errors.type ? 'border-red-500' : 'border-neutral-border'}
                      ${productType ? 'text-text-primary' : 'text-text-muted'}`}
                  >
                    <option value="">Select type…</option>
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-surface-card capitalize">
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Specify button — disabled until a type is selected */}
                <div className="flex flex-col gap-1.5 pt-[22px]">
                  <button
                    type="button"
                    disabled={!productType}
                    onClick={() => setProfileModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs border rounded-sm transition-all whitespace-nowrap
                      ${!productType
                        ? 'opacity-40 cursor-not-allowed border-neutral-border text-text-muted'
                        : profile
                          ? 'border-brand-gold text-brand-gold hover:bg-brand-gold/10'
                          : 'border-neutral-border text-text-secondary hover:border-brand-gold hover:text-brand-gold'
                      }`}
                    aria-label={profile ? 'Edit profile configuration' : 'Open profile configuration'}
                  >
                    {profile
                      ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      : <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                    }
                    {profile ? 'Edit Profile' : 'Specify'}
                  </button>
                </div>
              </div>

              {/* Profile summary chip — shown after profile is configured */}
              {profile && summary && (
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-dark border border-neutral-border rounded-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs text-text-secondary line-clamp-1">
                    <span className="capitalize text-text-muted">{productType}:</span>{' '}
                    {summary}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProfile(null)}
                    className="ml-auto text-text-muted hover:text-red-400 transition-colors"
                    aria-label="Clear profile"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <Field label="Description" error={errors.description}>
              <textarea
                rows={3}
                placeholder="Optional product description…"
                value={form.description}
                onChange={handleChange('description')}
                className={`${inputClass('description')} resize-none`}
              />
            </Field>

            {/* ── Actions ───────────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pt-2 border-t border-neutral-border">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm text-text-secondary border border-neutral-border hover:border-text-secondary transition-colors rounded-sm disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                {isEditing ? 'Save Changes' : 'Create Product'}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* ── Category Profile Modal (z-[60], stacks above this modal) ──── */}
      <CategoryModal
        open={profileModalOpen}
        type={productType}
        initialProfile={profile}
        onApply={handleProfileApply}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] uppercase tracking-widest text-text-muted">
        {label}
        {required && <span className="text-brand-gold ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500" role="alert">{error}</p>
      )}
    </div>
  );
}
