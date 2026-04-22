import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/store/cartStore';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import ProductCardSkeleton from '@/components/product/ProductCardSkeleton';
import StarRating from '@/components/product/StarRating';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns a translation key + params instead of a raw string so the label
// can be rendered in whatever language is currently active.
function getStockStatus(stock) {
  if (stock === 0) {
    return { key: 'product_detail.out_of_stock', params: {}, textClass: 'text-red-500', dotClass: 'bg-red-500' };
  }
  if (stock <= 5) {
    return { key: 'product_detail.low_stock', params: { count: stock }, textClass: 'text-yellow-500', dotClass: 'bg-yellow-500' };
  }
  return { key: 'product_detail.in_stock', params: {}, textClass: 'text-green-500', dotClass: 'bg-green-500' };
}

// "aloe vera" → "aloe_vera", "vitamin C" → "vitamin_c"
const toIngKey = (s) => s.toLowerCase().replace(/\s+/g, '_');

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

/**
 * Purpose: Full-page skeleton for the product detail layout while data loads.
 */
function ProductPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-4 w-40 bg-surface-card rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="aspect-square bg-surface-card rounded-lg" />
        <div className="flex flex-col gap-5 py-2">
          <div className="h-3 w-24 bg-surface-card rounded" />
          <div className="h-8 w-3/4 bg-surface-card rounded" />
          <div className="h-8 w-1/3 bg-surface-card rounded" />
          <div className="h-4 w-28 bg-surface-card rounded" />
          <div className="h-px bg-surface-card" />
          <div className="h-12 w-36 bg-surface-card rounded" />
          <div className="h-12 bg-surface-card rounded" />
          <div className="h-px bg-surface-card" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-surface-card rounded" />
            <div className="h-3 w-5/6 bg-surface-card rounded" />
            <div className="h-3 w-4/6 bg-surface-card rounded" />
          </div>
        </div>
      </div>
      <div className="mt-20">
        <div className="h-6 w-48 bg-surface-card rounded mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

/**
 * Purpose: Centered error state for the product detail page (e.g. 404 or network failure).
 */
function ProductError({ messageKey }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
      <AlertCircle className="w-14 h-14 text-text-muted mb-5" />
      <h2 className="text-2xl font-semibold text-text-primary mb-2">
        {t('errors.product_not_found_title')}
      </h2>
      <p className="text-text-muted max-w-md mb-8">
        {messageKey ? t(messageKey) : t('errors.product_not_found_msg')}
      </p>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 border border-brand-gold text-brand-gold px-6 py-3 text-sm uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('product_detail.back_to_products')}
      </Link>
    </div>
  );
}

// ─── Scent Profile Display ────────────────────────────────────────────────────

const ACCORD_ORDER = ['woody', 'oriental', 'sweet', 'citrus', 'floral', 'spicy', 'powdery', 'fresh'];

/**
 * Purpose: Renders active accord tags with percentage bars for a perfume's scent profile.
 */
function ScentProfileDisplay({ profile }) {
  const { t } = useTranslation();
  const active = ACCORD_ORDER.filter((k) => (profile[k] ?? 0) > 0);
  if (!active.length) return null;

  return (
    <div>
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
        {t('product_detail.scent_profile')}
      </h2>
      <div className="space-y-2.5">
        {active.map((accord) => {
          const label = t(`accord.${accord}`);
          return (
            <div key={accord} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-16 shrink-0">{label}</span>
              <div className="flex-1 bg-surface-card rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-brand-gold rounded-full"
                  style={{ width: `${(profile[accord] / 10) * 100}%` }}
                  aria-label={`${label}: ${profile[accord]} / 10`}
                />
              </div>
              <span className="text-xs text-text-muted w-5 text-right shrink-0">
                {profile[accord]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skincare Profile Display ─────────────────────────────────────────────────

/**
 * Purpose: Small bordered tag chip used inside skincare and cosmetics profile displays.
 */
function ProfileBadge({ children }) {
  return (
    <span className="px-2.5 py-1 border border-neutral-border text-text-secondary text-xs rounded-sm">
      {children}
    </span>
  );
}

/**
 * Purpose: Renders skin types and key ingredients from a skincare product's profile.
 */
function SkincareProfileDisplay({ profile }) {
  const { t } = useTranslation();
  const skinTypes   = profile.skinTypes   || [];
  const ingredients = profile.ingredients || [];
  if (!skinTypes.length && !ingredients.length) return null;

  return (
    <div className="space-y-4">
      {skinTypes.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">
            {t('product_detail.skin_types_label')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {skinTypes.map((st) => (
              <ProfileBadge key={st}>{t(`skin_type.${st}`)}</ProfileBadge>
            ))}
          </div>
        </div>
      )}
      {ingredients.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">
            {t('product_detail.key_ingredients')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ing) => (
              <span
                key={ing}
                className="px-2.5 py-1 bg-surface-card border border-neutral-border text-text-secondary text-xs rounded-sm"
              >
                {t(`ingredient.${toIngKey(ing)}`)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cosmetics Profile Display ────────────────────────────────────────────────

const COLOR_SWATCHES = {
  nude: '#C4A882', red: '#C0392B', pink: '#E91E8C', brown: '#8B4513', coral: '#FF7F50',
};

/**
 * Purpose: Renders available color family tags from a cosmetics product's profile.
 */
function CosmeticsProfileDisplay({ profile }) {
  const { t } = useTranslation();
  const colors = profile.colors || [];
  if (!colors.length) return null;

  return (
    <div>
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">
        {t('product_detail.color_family')}
      </h2>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <div key={color} className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full border border-white/10 shrink-0"
              style={{ background: COLOR_SWATCHES[color] || '#6B6B6B' }}
              aria-hidden="true"
            />
            <span className="text-xs text-text-secondary">{t(`color.${color}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category Pills ───────────────────────────────────────────────────────────

/**
 * Purpose: Small uppercase tag chip for displaying the product category (e.g. "men", "unisex").
 */
function CategoryPill({ label }) {
  return (
    <span className="inline-block border border-neutral-border text-text-muted text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-sm">
      {label}
    </span>
  );
}

// ─── Quantity Selector ────────────────────────────────────────────────────────

/**
 * Purpose: Stepper control for selecting add-to-cart quantity; clamps to [1, available stock].
 */
function QuantitySelector({ qty, setQty, max, disabled }) {
  const { t } = useTranslation();
  const decrease = () => setQty((q) => Math.max(1, q - 1));
  const increase = () => setQty((q) => Math.min(max, q + 1));

  return (
    <div
      className="inline-flex items-center border border-neutral-border rounded-sm overflow-hidden"
      role="group"
      aria-label={t('product_detail.qty_selector')}
    >
      <button
        onClick={decrease}
        disabled={disabled || qty <= 1}
        aria-label={t('product_detail.decrease_qty')}
        className="w-11 h-11 flex items-center justify-center text-text-secondary hover:text-brand-gold hover:bg-surface-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span
        className="w-12 h-11 flex items-center justify-center text-text-primary text-sm font-medium border-x border-neutral-border select-none"
        aria-live="polite"
        aria-label={`${qty}`}
      >
        {qty}
      </span>

      <button
        onClick={increase}
        disabled={disabled || qty >= max}
        aria-label={t('product_detail.increase_qty')}
        className="w-11 h-11 flex items-center justify-center text-text-secondary hover:text-brand-gold hover:bg-surface-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── ProductPage ──────────────────────────────────────────────────────────────

/**
 * Purpose: Product detail page with image, stock status, quantity selector, add-to-cart, star rating, and similar product recommendations.
 */
export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState(false);
  // Store i18n key instead of raw string so it renders in the active language
  const [errorKey, setErrorKey] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [qty, setQty] = useState(1);

  const [userRating, setUserRating]           = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    setRecommendations([]);
    setRecsError(false);

    const fetchProduct = async () => {
      setLoading(true);
      setErrorKey(null);
      setImgError(false);
      setQty(1);
      setUserRating(null);

      try {
        const { data } = await api.get(`/products/${id}`);
        if (!cancelled) {
          setProduct(data);
          fetchRecommendations(data._id);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorKey(
            err.response?.status === 404
              ? 'errors.product_not_found_404'
              : 'errors.load_product'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    return () => { cancelled = true; };
  }, [id]);

  const fetchRecommendations = async (productId) => {
    setRecsLoading(true);
    setRecsError(false);
    try {
      const { data } = await api.get(`/products/${productId}/recommendations`, {
        params: { limit: 4 },
      });
      setRecommendations(data.data ?? []);
    } catch {
      setRecsError(true);
    } finally {
      setRecsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addItem(product, qty);
    toast.success(t('product.added_to_cart_toast', { name: product.name }), {
      duration: 2000,
      style: { background: '#16a34a', color: '#fff' },
    });
  };

  const handleRate = async (stars) => {
    if (!user || ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      const { data } = await api.post(`/products/${product._id}/rate`, { rating: stars });
      setUserRating(data.userRating);
      setProduct((prev) => ({
        ...prev,
        averageRating: data.averageRating,
        ratingCount:   data.ratingCount,
      }));
      toast.success(t('product_detail.rating_submitted'), {
        duration: 2000,
        style: { background: '#16a34a', color: '#fff' },
      });
    } catch {
      toast.error(t('errors.submit_rating'), {
        style: { background: '#dc2626', color: '#fff' },
      });
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return <Layout><ProductPageSkeleton /></Layout>;
  }

  if (errorKey || !product) {
    return <Layout><ProductError messageKey={errorKey} /></Layout>;
  }

  const isOOS = product.stock === 0;
  const stockStatus = getStockStatus(product.stock);
  const fallbackImg = `https://placehold.co/800x800/111111/D4AF37?text=${encodeURIComponent(product.brand)}`;

  return (
    <Layout>

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2"
      >
        <ol className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-widest">
          <li>
            <Link to="/" className="hover:text-brand-gold transition-colors">
              {t('breadcrumb.home')}
            </Link>
          </li>
          <li aria-hidden="true" className="opacity-40">/</li>
          <li>
            <Link to="/products" className="hover:text-brand-gold transition-colors">
              {t('breadcrumb.products')}
            </Link>
          </li>
          <li aria-hidden="true" className="opacity-40">/</li>
          <li className="text-text-secondary truncate max-w-[180px]" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* ── Main product section ─────────────────────────────────────────── */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
        aria-label="Product details"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* ── Left: Image ──────────────────────────────────────────────── */}
          <div className="group relative aspect-square overflow-hidden bg-surface-dark rounded-sm">
            <img
              src={imgError ? fallbackImg : (product.imageUrl || fallbackImg)}
              alt={`${product.brand} ${product.name}`}
              onError={() => setImgError(true)}
              loading="lazy"
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {isOOS && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="border border-brand-gold/40 text-brand-gold/70 text-xs uppercase tracking-[0.25em] px-4 py-2">
                  {t('product_detail.out_of_stock')}
                </span>
              </div>
            )}
          </div>

          {/* ── Right: Product info ───────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              {product.brand}
            </p>

            <h1 className="text-3xl sm:text-4xl font-light text-text-primary leading-tight">
              {product.name}
            </h1>

            <p
              className="text-3xl font-light text-brand-gold"
              aria-label={`$${product.price.toFixed(2)}`}
            >
              ${product.price.toFixed(2)}
            </p>

            <StarRating
              value={product.averageRating ?? 0}
              count={product.ratingCount  ?? 0}
              size="md"
            />

            {/* Stock status */}
            <div className="flex items-center gap-2" aria-live="polite">
              <span className={`w-2 h-2 rounded-full ${stockStatus.dotClass}`} aria-hidden="true" />
              <span className={`text-sm ${stockStatus.textClass}`}>
                {t(stockStatus.key, stockStatus.params)}
              </span>
            </div>

            <div className="border-t border-neutral-border" />

            {product.category && (
              <div aria-label="Category">
                <CategoryPill label={product.category} />
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <QuantitySelector
                qty={qty}
                setQty={setQty}
                max={product.stock}
                disabled={isOOS}
              />

              <button
                onClick={handleAddToCart}
                disabled={isOOS}
                aria-label={
                  isOOS
                    ? t('product_detail.oos_aria')
                    : t('product_detail.add_aria', { name: product.name })
                }
                className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-8 py-3 border text-sm uppercase tracking-widest font-medium transition-all duration-200
                  border-brand-gold text-brand-gold
                  hover:bg-brand-gold hover:text-brand-black
                  disabled:border-neutral-border disabled:text-text-muted disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                {isOOS ? t('product_detail.unavailable') : t('product.add_to_cart')}
              </button>
            </div>

            <div className="border-t border-neutral-border" />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
                  {product.type === 'perfume'
                    ? t('product_detail.about_fragrance')
                    : t('product_detail.about_product')}
                </h2>
                <p className="text-text-muted leading-relaxed max-w-prose text-sm">
                  {product.description}
                </p>
              </div>
            )}

            {/* Category-specific profiles */}
            {product.type === 'perfume' && product.perfumeProfile && (
              <>
                <div className="border-t border-neutral-border" />
                <ScentProfileDisplay profile={product.perfumeProfile} />
              </>
            )}
            {product.type === 'skincare' && product.skincareProfile && (
              <>
                <div className="border-t border-neutral-border" />
                <SkincareProfileDisplay profile={product.skincareProfile} />
              </>
            )}
            {product.type === 'cosmetics' && product.cosmeticsProfile && (
              <>
                <div className="border-t border-neutral-border" />
                <CosmeticsProfileDisplay profile={product.cosmeticsProfile} />
              </>
            )}

            {/* ── Rate this product ───────────────────────────────────────── */}
            <div className="border-t border-neutral-border" />
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
                {t('product_detail.rate_this')}
              </h2>

              {user ? (
                <div className="flex flex-col gap-2">
                  <StarRating
                    value={product.averageRating ?? 0}
                    count={product.ratingCount  ?? 0}
                    onChange={handleRate}
                    userRating={userRating}
                    disabled={ratingSubmitting}
                    size="md"
                  />
                  {userRating && (
                    <p className="text-xs text-text-muted">
                      {t(
                        userRating === 1
                          ? 'product_detail.your_rating_one'
                          : 'product_detail.your_rating_other',
                        { count: userRating }
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  <Link to="/login" className="text-brand-gold hover:underline">
                    {t('nav.login')}
                  </Link>{' '}
                  {t('product_detail.login_to_rate')}
                </p>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── Recommendations ──────────────────────────────────────────────── */}
      {(recsLoading || recommendations.length > 0 || recsError) && (
        <section
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
          aria-label="Recommended products"
        >
          <div className="flex items-center gap-6 mb-2">
            <h2 className="text-xs uppercase tracking-[0.25em] text-text-muted whitespace-nowrap">
              {t('product_detail.recommended')}
            </h2>
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.25), transparent)' }}
              aria-hidden="true"
            />
          </div>

          {!recsLoading && !recsError && recommendations.length > 0 && product?.type === 'perfume' && (
            <p className="text-[11px] text-text-muted mb-6">{t('product_detail.similar_scent')}</p>
          )}
          {!recsLoading && !recsError && recommendations.length > 0 && product?.type === 'skincare' && (
            <p className="text-[11px] text-text-muted mb-6">{t('product_detail.shares_ingredients')}</p>
          )}
          {!recsLoading && !recsError && recommendations.length > 0 &&
            product?.type !== 'perfume' && product?.type !== 'skincare' && (
            <div className="mb-6" />
          )}

          {recsError && (
            <p className="text-sm text-text-muted py-6">{t('errors.load_recs')}</p>
          )}
          {!recsLoading && !recsError && recommendations.length === 0 && (
            <p className="text-sm text-text-muted py-6">{t('product_detail.no_recs')}</p>
          )}
          {!recsError && (
            <ProductGrid products={recommendations} loading={recsLoading} />
          )}
        </section>
      )}

    </Layout>
  );
}
