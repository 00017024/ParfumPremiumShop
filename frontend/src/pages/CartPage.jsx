import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { useCartStore } from "@/store/cartStore";
import Layout from "@/components/layout/Layout";
import EmptyState from "@/components/product/EmptyState";

/* ───────────── Quantity Selector ───────────── */

function QuantitySelector({ productId, quantity, stock, onUpdate }) {
  const decrease = () => {
    if (quantity > 1) onUpdate(productId, quantity - 1);
  };

  const increase = () => {
    if (quantity < stock) onUpdate(productId, quantity + 1);
  };

  return (
    <div className="inline-flex items-center border border-neutral-border rounded-sm">
      <button
        onClick={decrease}
        disabled={quantity <= 1}
        className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-brand-gold disabled:opacity-30"
      >
        <Minus className="w-3 h-3" />
      </button>

      <span className="w-10 h-9 flex items-center justify-center text-sm text-text-primary border-x border-neutral-border">
        {quantity}
      </span>

      <button
        onClick={increase}
        disabled={quantity >= stock}
        className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-brand-gold disabled:opacity-30"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ───────────── Cart Item ───────────── */

function CartItem({ item, onUpdate, onRemove }) {
  const { product, quantity } = item;

  const fallbackImg = `https://placehold.co/200x200/2A2A2A/D4AF37?text=${encodeURIComponent(
    product.brand
  )}`;

  const lineTotal = (product.price * quantity).toFixed(2);

  return (
    <li className="flex items-center gap-4 border-b border-neutral-border py-5">

      <Link
        to={`/products/${product._id}`}
        className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-sm overflow-hidden bg-surface-dark block"
      >
        <img
          src={product.imageUrl || fallbackImg}
          alt={`${product.brand} ${product.name}`}
          loading="lazy"
          onError={(e) => (e.currentTarget.src = fallbackImg)}
          className="w-full h-full object-cover"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">
          {product.brand}
        </p>

        <Link to={`/products/${product._id}`}>
          <h3 className="text-sm sm:text-base font-medium text-text-primary truncate hover:text-brand-gold">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm text-brand-gold mt-1">
          ${Number(product.price).toFixed(2)}
        </p>

        <div className="flex items-center gap-3 mt-3 sm:hidden">
          <QuantitySelector
            productId={product._id}
            quantity={quantity}
            stock={product.stock}
            onUpdate={onUpdate}
          />

          <button
            onClick={() => onRemove(product._id, product.name)}
            className="text-text-muted hover:text-red-500 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="hidden sm:block">
        <QuantitySelector
          productId={product._id}
          quantity={quantity}
          stock={product.stock}
          onUpdate={onUpdate}
        />
      </div>

      <p className="hidden sm:block w-20 text-right text-sm font-medium text-text-primary">
        ${lineTotal}
      </p>

      <button
        onClick={() => onRemove(product._id, product.name)}
        className="hidden sm:flex text-text-muted hover:text-red-500 p-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>

    </li>
  );
}

/* ───────────── Order Summary ───────────── */

function OrderSummary({ subtotal, itemCount }) {
  const { t } = useTranslation();
  const isEmpty = itemCount === 0;

  return (
    <aside className="bg-surface-card border border-neutral-border rounded-sm p-6 flex flex-col gap-5 h-fit">

      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted">
        {t('cart.order_summary')}
      </h2>

      <div className="flex justify-between">
        <span className="text-sm text-text-secondary">
          {t('cart.subtotal')} ({t('cart.items_count', { count: itemCount })})
        </span>

        <span className="text-lg text-text-primary">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-sm text-text-secondary">{t('cart.shipping')}</span>
        <span className="text-xs text-text-muted italic">
          {t('cart.shipping_info')}
        </span>
      </div>

      <div className="border-t border-neutral-border" />

      <div className="flex justify-between">
        <span className="text-sm uppercase tracking-widest text-text-secondary">
          {t('cart.total')}
        </span>

        <span className="text-xl text-brand-gold">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      <Link
        to={isEmpty ? "#" : "/checkout"}
        className={`flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-widest
        ${
          isEmpty
            ? "bg-neutral-border text-text-muted pointer-events-none"
            : "bg-brand-gold text-brand-black hover:bg-opacity-90"
        }`}
      >
        {t('cart.proceed_checkout')}
        <ArrowRight className="w-4 h-4" />
      </Link>

      <Link
        to="/products"
        className="text-center text-xs uppercase tracking-widest text-text-muted hover:text-brand-gold"
      >
        {t('cart.continue_shopping')}
      </Link>
    </aside>
  );
}

/* ───────────── Cart Page ───────────── */

export default function CartPage() {
  const { t } = useTranslation();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const itemCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleUpdate = (productId, newQty) => {
    updateQuantity(productId, newQty);
  };

  const handleRemove = (productId, name) => {
    removeItem(productId);
    toast.success(t('cart.removed', { name }), {
      duration: 2000,
      style: { background: "#1a1a1a", color: "#e8e0d0" }
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="flex items-center gap-3 mb-10">
          <ShoppingBag className="w-5 h-5 text-brand-gold" />
          <h1 className="text-2xl text-text-primary">
            {t('cart.title')}
          </h1>

          {itemCount > 0 && (
            <span className="text-sm text-text-muted">
              ({t('cart.items_count', { count: itemCount })})
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center">
            <EmptyState
              message={t('cart.empty')}
              description={t('cart.empty_description')}
            />

            <Link
              to="/products"
              className="mt-2 border border-brand-gold text-brand-gold px-6 py-3 text-sm uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black"
            >
              {t('cart.continue_shopping')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            <section className="lg:col-span-2">
              <ul>
                {items.map((item) => (
                  <CartItem
                    key={item.product._id}
                    item={item}
                    onUpdate={handleUpdate}
                    onRemove={handleRemove}
                  />
                ))}
              </ul>
            </section>

            <OrderSummary
              subtotal={subtotal}
              itemCount={itemCount}
            />

          </div>
        )}
      </div>
    </Layout>
  );
}
