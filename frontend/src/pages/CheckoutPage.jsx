import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingBag, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import Layout from '@/components/layout/Layout';
import EmptyState from '@/components/product/EmptyState';

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form) {
  const errors = {};

  if (!form.name.trim() || form.name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  }

  const uzPhoneRegex = /^\+998\d{9}$/;

  if (!uzPhoneRegex.test(form.phone.trim())) {
    errors.phone = 'Phone must be in format +998XXXXXXXXX';
  }

  if (!['Tashkent', 'Samarkand'].includes(form.city)) {
    errors.city = 'Delivery is only available in Tashkent or Samarkand.';
  }

  if (!form.address.trim() || form.address.trim().length < 5) {
    errors.address = 'Delivery address must be at least 5 characters.';
  }

  return errors;
}

// ─── FormField ────────────────────────────────────────────────────────────────

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

function OrderSummaryPanel({ items, subtotal }) {
  return (
    <aside
      className="bg-surface-card border border-neutral-border rounded-sm p-6 flex flex-col gap-5 h-fit"
      aria-label="Order summary"
    >
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted">
        Order Summary
      </h2>

      {/* Item list */}
      <ul className="flex flex-col gap-4" aria-label="Items in order">
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
                <p className="text-xs text-text-muted mt-0.5">Qty: {quantity}</p>
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
        <span className="text-text-secondary">Subtotal</span>
        <span className="text-text-primary">${subtotal.toFixed(2)}</span>
      </div>

      {/* Shipping */}
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">Shipping</span>
        <span className="text-xs text-text-muted italic">After confirmation</span>
      </div>

      <div className="border-t border-neutral-border" />

      {/* Total */}
      <div className="flex justify-between items-baseline">
        <span className="text-xs uppercase tracking-widest text-text-secondary">Total</span>
        <span className="text-xl font-light text-brand-gold">${subtotal.toFixed(2)}</span>
      </div>
    </aside>
  );
}

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
  name: '',
  phone: '',
  city: 'Tashkent',
  address: '',
  notes: ''
});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Derived — no useState needed
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const isCartEmpty = items.length === 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({
            productId: i.product._id,
            quantity: i.quantity,
      })),
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        city: form.city,
        address: form.address.trim(),
        notes: form.notes.trim() || undefined,
      };

      await api.post('/orders', payload);

      clearCart();
      navigate('/order-success');
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to place order. Please try again.';
      toast.error(msg, {
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
          <EmptyState message="Your cart is empty" />
          <Link
            to="/products"
            className="mt-2 inline-flex items-center gap-2 border border-brand-gold text-brand-gold px-6 py-3 text-sm uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-200"
          >
            Browse Products
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
                Cart
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="w-3 h-3 opacity-40" /></li>
            <li className="text-text-secondary" aria-current="page">Checkout</li>
          </ol>
        </nav>

        {/* ── Page heading ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10">
          <ShoppingBag className="w-5 h-5 text-brand-gold" aria-hidden="true" />
          <h1 className="text-2xl font-light text-text-primary tracking-wide">
            Checkout
          </h1>
        </div>

        {/* ── Two-column layout ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14 items-start">

          {/* ── Left: Form ────────────────────────────────────────────── */}
          <section className="lg:col-span-2" aria-label="Delivery information">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-6"
            >
              <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted pb-2 border-b border-neutral-border">
                Delivery Information
              </h2>

              {/* Customer Name */}
              <FormField
                id="checkout-name"
                label="Full Name"
                required
                error={errors.name}
              >
                <input
                  id="checkout-name"
                  type="text"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={handleChange('name')}
                  autoComplete="name"
                  aria-required="true"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={inputClass(!!errors.name)}
                />
              </FormField>

              {/* Phone */}
              <FormField
                id="checkout-phone"
                label="Phone Number"
                required
                error={errors.phone}
              >
                <input
                  id="checkout-phone"
                  type="tel"
                  placeholder="+998901234567"
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
                label="City"
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

              {/* Address */}
              <FormField
                id="checkout-address"
                label="Delivery Address"
                required
                error={errors.address}
              >
                <textarea
                  id="checkout-address"
                  rows={3}
                  placeholder="Street, district, city…"
                  value={form.address}
                  onChange={handleChange('address')}
                  autoComplete="street-address"
                  aria-required="true"
                  className={`${inputClass(!!errors.address)} resize-none`}
                />
              </FormField>

              {/* Notes */}
              <FormField
                id="checkout-notes"
                label="Order Notes"
                required={false}
                error={undefined}
              >
                <textarea
                  id="checkout-notes"
                  rows={2}
                  placeholder="Gift wrapping, delivery instructions… (optional)"
                  value={form.notes}
                  onChange={handleChange('notes')}
                  className={`${inputClass(false)} resize-none`}
                />
              </FormField>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || isCartEmpty}
                aria-label={submitting ? 'Processing order…' : 'Place order'}
                className="mt-2 flex items-center justify-center gap-2.5 w-full py-4 text-sm uppercase tracking-widest font-medium transition-all duration-200
                  bg-brand-gold text-brand-black
                  hover:bg-opacity-90
                  active:scale-[0.99]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Processing…
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </form>
          </section>

          {/* ── Right: Order summary ───────────────────────────────────── */}
          <OrderSummaryPanel items={items} subtotal={subtotal} />

        </div>
      </div>
    </Layout>
  );
}