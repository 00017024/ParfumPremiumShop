import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingBag, ChevronRight, AlertTriangle, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import MapPicker from '@/components/MapPicker';
import { useCartStore } from '@/store/cartStore';
import { useStockValidation } from '@/hooks/useStockValidation';
import { UZ_PHONE_REGEX } from '@/lib/validation';
import Layout from '@/components/layout/Layout';
import EmptyState from '@/components/product/EmptyState';

// ─── FormField ────────────────────────────────────────────────────────────────

/**
 * Purpose: Accessible form field wrapper with label, required marker, and inline error message.
 */
function FormField({ id, label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] uppercase tracking-widest text-text-muted"
      >
        {label}
        {required && <span className="text-brand-gold ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-0.5" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input / Textarea shared styles ──────────────────────────────────────────

const inputClass = (hasError) =>
  `w-full bg-surface-card border rounded-sm px-4 py-3 text-sm text-text-primary placeholder-text-muted
   focus:outline-none focus:border-brand-gold transition-colors
   ${hasError ? 'border-red-500' : 'border-neutral-border'}`;

// ─── OrderSummaryPanel ────────────────────────────────────────────────────────

/**
 * Purpose: Read-only order summary sidebar showing line items, stock warnings, and the total for the checkout form.
 */
function OrderSummaryPanel({ items, subtotal, stockIssues = {} }) {
  const { t } = useTranslation();

  return (
    <aside
      className="bg-surface-card border border-neutral-border rounded-sm p-6 flex flex-col gap-5 h-fit"
      aria-label={t('cart.order_summary')}
    >
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted">
        {t('cart.order_summary')}
      </h2>

      {/* Item list */}
      <ul className="flex flex-col gap-4" aria-label={t('cart.order_summary')}>
        {items.map((item) => {
          const { product, quantity } = item;
          const fallback = `https://placehold.co/80x80/2A2A2A/D4AF37?text=${encodeURIComponent(product.brand)}`;
          const lineTotal = (product.price * quantity).toFixed(2);

          return (
            <li key={product._id} className="flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-sm bg-surface-dark">
                <img
                  src={product.imageUrl || fallback}
                  alt={`${product.brand} ${product.name}`}
                  onError={(e) => { e.currentTarget.src = fallback; }}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-text-muted truncate">
                  {product.brand}
                </p>
                <p className="text-sm text-text-primary truncate">{product.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{t('checkout.qty', { count: quantity })}</p>
                {stockIssues[product._id] && (
                  <p className="flex items-start gap-1 text-xs text-red-400 mt-1.5 leading-tight">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
                    {stockIssues[product._id]}
                  </p>
                )}
              </div>

              {/* Line total */}
              <p className="text-sm font-medium text-text-primary flex-shrink-0">
                ${lineTotal}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-neutral-border" />

      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{t('cart.subtotal')}</span>
        <span className="text-text-primary">${subtotal.toFixed(2)}</span>
      </div>

      {/* Shipping */}
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{t('cart.shipping')}</span>
        <span className="text-xs text-text-muted italic">{t('checkout.shipping_after')}</span>
      </div>

      <div className="border-t border-neutral-border" />

      {/* Total */}
      <div className="flex justify-between items-baseline">
        <span className="text-xs uppercase tracking-widest text-text-secondary">{t('cart.total')}</span>
        <span className="text-xl font-light text-brand-gold">${subtotal.toFixed(2)}</span>
      </div>
    </aside>
  );
}

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

/**
 * Purpose: Checkout form page; validates delivery details, runs live stock checks, and submits the order via API.
 */
export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items          = useCartStore((state) => state.items);
  const clearCart      = useCartStore((state) => state.clearCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem     = useCartStore((state) => state.removeItem);
  const updateProduct  = useCartStore((state) => state.updateProduct);

  // ── Stock validation ────────────────────────────────────────────────────────
  const { stockIssues, checking } = useStockValidation(
    items,
    updateQuantity,
    removeItem,
    updateProduct
  );

  const hasStockIssues = Object.keys(stockIssues).length > 0;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: 'Tashkent',
    notes: '',
  });
  const [location, setLocation]   = useState(null);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const isCartEmpty = items.length === 0;

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (form, location) => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = t('validation.name_min');
    if (!UZ_PHONE_REGEX.test(form.phone.trim()))
      e.phone = t('validation.phone_invalid');
    if (!['Tashkent', 'Samarkand'].includes(form.city))
      e.city = t('validation.city_invalid');
    if (!location)
      e.location = t('validation.location_required');
    return e;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(form, location);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.product._id,
          quantity:  i.quantity,
        })),
        customerName: form.name.trim(),
        phone:        form.phone.trim(),
        city:         form.city,
        notes:        form.notes.trim() || undefined,
        location,
      };

      await api.post('/orders', payload);

      clearCart();
      navigate('/order-success', { state: { fromCheckout: true } });
    } catch {
      toast.error(t('checkout.submit_error'), {
        style: { background: '#dc2626', color: '#fff' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Empty cart guard ───────────────────────────────────────────────────────
  if (isCartEmpty) {
    return (
      <Layout>
        <div className="flex flex-col items-center pt-10">
          <EmptyState message={t('cart.empty')} />
          <Link
            to="/products"
            className="mt-2 inline-flex items-center gap-2 border border-brand-gold text-brand-gold px-6 py-3 text-sm uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-200"
          >
            {t('checkout.browse_products')}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-widest">
            <li>
              <Link to="/cart" className="hover:text-brand-gold transition-colors">
                {t('checkout.breadcrumb_cart')}
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="w-3 h-3 opacity-40" /></li>
            <li className="text-text-secondary" aria-current="page">{t('checkout.title')}</li>
          </ol>
        </nav>

        {/* ── Page heading ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10">
          <ShoppingBag className="w-5 h-5 text-brand-gold" aria-hidden="true" />
          <h1 className="text-2xl font-light text-text-primary tracking-wide">
            {t('checkout.title')}
          </h1>
        </div>

        {/* ── Two-column layout ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14 items-start">

          {/* ── Left: Form ────────────────────────────────────────────── */}
          <section className="lg:col-span-2" aria-label={t('checkout.delivery_info')}>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-6"
            >
              <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted pb-2 border-b border-neutral-border">
                {t('checkout.delivery_info')}
              </h2>

              {/* Customer Name */}
              <FormField
                id="checkout-name"
                label={t('checkout.full_name')}
                required
                error={errors.name}
              >
                <input
                  id="checkout-name"
                  type="text"
                  placeholder={t('auth.full_name_placeholder')}
                  value={form.name}
                  onChange={handleChange('name')}
                  autoComplete="name"
                  aria-required="true"
                  className={inputClass(!!errors.name)}
                />
              </FormField>

              {/* Phone */}
              <FormField
                id="checkout-phone"
                label={t('checkout.phone')}
                required
                error={errors.phone}
              >
                <input
                  id="checkout-phone"
                  type="tel"
                  placeholder={t('auth.phone_placeholder')}
                  value={form.phone}
                  onChange={handleChange('phone')}
                  autoComplete="tel"
                  aria-required="true"
                  className={inputClass(!!errors.phone)}
                />
              </FormField>

              {/* City */}
              <FormField
                id="checkout-city"
                label={t('checkout.city')}
                required
                error={errors.city}
              >
                <select
                  id="checkout-city"
                  value={form.city}
                  onChange={handleChange('city')}
                  className={inputClass(!!errors.city)}
                >
                  <option value="Tashkent">Tashkent</option>
                  <option value="Samarkand">Samarkand</option>
                </select>
              </FormField>

              {/* Notes */}
              <FormField
                id="checkout-notes"
                label={t('checkout.notes')}
                required={false}
                error={undefined}
              >
                <textarea
                  id="checkout-notes"
                  rows={2}
                  placeholder={t('checkout.notes_placeholder')}
                  value={form.notes}
                  onChange={handleChange('notes')}
                  className={`${inputClass(false)} resize-none`}
                />
              </FormField>

              {/* Delivery Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-text-muted">
                  {t('checkout.location')}
                  <span className="text-brand-gold ml-1" aria-hidden="true">*</span>
                </label>
                <p className="text-xs text-text-muted mb-1">
                  {t('checkout.location_hint')}
                </p>

                <div
                  className={`rounded-sm overflow-hidden border ${
                    errors.location ? 'border-red-500' : 'border-neutral-border'
                  }`}
                  style={{ height: '300px' }}
                >
                  <MapPicker
                    value={location}
                    onChange={(coords) => {
                      setLocation(coords);
                      if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
                    }}
                  />
                </div>

                {location ? (
                  <p className="flex items-center gap-1.5 text-xs text-brand-gold mt-0.5">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
                ) : null}

                {errors.location && (
                  <p className="text-xs text-red-500 mt-0.5" role="alert">
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || isCartEmpty || checking || hasStockIssues}
                aria-label={
                  checking        ? t('checkout.checking_aria') :
                  hasStockIssues  ? t('checkout.stock_issues_aria') :
                  submitting      ? t('checkout.processing_aria') :
                  t('checkout.place_order_aria')
                }
                className="mt-2 flex items-center justify-center gap-2.5 w-full py-4 text-sm uppercase tracking-widest font-medium transition-all duration-200
                  bg-brand-gold text-brand-black
                  hover:bg-opacity-90
                  active:scale-[0.99]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    {t('checkout.checking')}
                  </>
                ) : submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    {t('checkout.processing')}
                  </>
                ) : hasStockIssues ? (
                  t('checkout.fix_stock')
                ) : (
                  t('checkout.place_order')
                )}
              </button>
            </form>
          </section>

          {/* ── Right: Order summary ───────────────────────────────────── */}
          <OrderSummaryPanel items={items} subtotal={subtotal} stockIssues={stockIssues} />

        </div>
      </div>
    </Layout>
  );
}
