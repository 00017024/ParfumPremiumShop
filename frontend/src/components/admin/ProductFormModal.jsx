import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  brand: '',
  price: '',
  stock: '',
  description: '',
  imageUrl: '',
  categories: '',   // comma-separated string; split on submit
};

function validate(form) {
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
  return errors;
}

/**
 * Modal for creating or editing a product.
 *
 * @param {boolean}         open        - Whether the modal is visible.
 * @param {object|null}     product     - Existing product to edit, or null to create.
 * @param {boolean}         submitting  - Whether the save action is in-flight.
 * @param {function}        onSave      - Called with the validated payload object.
 * @param {function}        onClose     - Called to close the modal.
 */
export default function ProductFormModal({
  open,
  product = null,
  submitting = false,
  onSave,
  onClose,
}) {
  const isEditing = Boolean(product);

  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Populate form when editing an existing product
  useEffect(() => {
    if (product) {
      setForm({
        name:        product.name ?? '',
        brand:       product.brand ?? '',
        price:       product.price?.toString() ?? '',
        stock:       product.stock?.toString() ?? '',
        description: product.description ?? '',
        imageUrl:    product.imageUrl ?? '',
        categories:  (product.categories ?? []).join(', '),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [product, open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      name:        form.name.trim(),
      brand:       form.brand.trim(),
      price:       Number(form.price),
      stock:       form.stock !== '' ? parseInt(form.stock, 10) : 0,
      description: form.description.trim() || undefined,
      imageUrl:    form.imageUrl.trim() || undefined,
      categories:  form.categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    };

    onSave(payload);
  };

  const inputClass = (field) =>
    `w-full bg-surface-dark border rounded-sm px-3 py-2.5 text-sm text-text-primary placeholder-text-muted
     focus:outline-none focus:border-brand-gold transition-colors
     ${errors[field] ? 'border-red-500' : 'border-neutral-border'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="relative bg-surface-card border border-neutral-border rounded-sm shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-border">
          <h2
            id="product-form-title"
            className="text-sm uppercase tracking-[0.2em] text-text-primary"
          >
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 flex flex-col gap-5">

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

          {/* Price + Stock row */}
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

          {/* Categories */}
          <Field label="Categories" error={errors.categories}>
            <input
              type="text"
              placeholder="floral, woody, citrus (comma separated)"
              value={form.categories}
              onChange={handleChange('categories')}
              className={inputClass('categories')}
            />
          </Field>

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

          {/* Actions */}
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
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ─── Internal field wrapper ───────────────────────────────────────────────────

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
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