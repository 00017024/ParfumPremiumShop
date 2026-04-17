import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/store/cartStore';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import ProductCardSkeleton from '@/components/product/ProductCardSkeleton';
import StarRating from '@/components/product/StarRating';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives stock status label, color classes, and dot color from stock count.
 */
function getStockStatus(stock) {
  if (stock === 0) {
    return {
      label: 'Out of Stock',
      textClass: 'text-red-500',
      dotClass: 'bg-red-500',
    };
  }
  if (stock <= 5) {
    return {
      label: `Low Stock — only ${stock} left`,
      textClass: 'text-yellow-500',
      dotClass: 'bg-yellow-500',
    };
  }
  return {
    label: 'In Stock',
    textClass: 'text-green-500',
    dotClass: 'bg-green-500',
  };
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ProductPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Breadcrumb placeholder */}
      <div className="h-4 w-40 bg-surface-card rounded mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image placeholder */}
        <div className="aspect-square bg-surface-card rounded-lg" />

        {/* Info placeholders */}
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

      {/* Related products skeleton */}
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

function ProductError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
      <AlertCircle className="w-14 h-14 text-text-muted mb-5" />
      <h2 className="text-2xl font-semibold text-text-primary mb-2">
        Product Not Found
      </h2>
      <p className="text-text-muted max-w-md mb-8">
        {message || "This product doesn't exist or may have been removed."}
      </p>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 border border-brand-gold text-brand-gold px-6 py-3 text-sm uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>
    </div>
  );
}

// ─── Scent Profile Display ────────────────────────────────────────────────────

const ACCORD_ORDER = ['woody', 'oriental', 'sweet', 'citrus', 'floral', 'spicy', 'powdery', 'fresh'];
const ACCORD_LABELS = {
  woody: 'Woody', oriental: 'Oriental', sweet: 'Sweet', citrus: 'Citrus',
  floral: 'Floral', spicy: 'Spicy', powdery: 'Powdery', fresh: 'Fresh',
};

function ScentProfileDisplay({ profile }) {
  const active = ACCORD_ORDER.filter((k) => (profile[k] ?? 0) > 0);
  if (!active.length) return null;

  return (
    <div>
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
        Scent Profile
      </h2>
      <div className="space-y-2.5">
        {active.map((accord) => (
          <div key={accord} className="flex items-center gap-3">
            <span className="text-xs text-text-secondary w-16 shrink-0">
              {ACCORD_LABELS[accord]}
            </span>
            <div className="flex-1 bg-surface-card rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-brand-gold rounded-full"
                style={{ width: `${(profile[accord] / 10) * 100}%` }}
                aria-label={`${ACCORD_LABELS[accord]}: ${profile[accord]} out of 10`}
              />
            </div>
            <span className="text-xs text-text-muted w-5 text-right shrink-0">
              {profile[accord]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skincare Profile Display ─────────────────────────────────────────────────

function ProfileBadge({ children }) {
  return (
    <span className="px-2.5 py-1 border border-neutral-border text-text-secondary text-xs rounded-sm capitalize">
      {children}
    </span>
  );
}

function SkincareProfileDisplay({ profile }) {
  const skinTypes   = profile.skinTypes   || [];
  const ingredients = profile.ingredients || [];
  if (!skinTypes.length && !ingredients.length) return null;

  return (
    <div className="space-y-4">
      {skinTypes.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">
            Skin Types
          </h2>
          <div className="flex flex-wrap gap-2">
            {skinTypes.map((t) => <ProfileBadge key={t}>{t}</ProfileBadge>)}
          </div>
        </div>
      )}
      {ingredients.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">
            Key Ingredients
          </h2>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ing) => (
              <span
                key={ing}
                className="px-2.5 py-1 bg-surface-card border border-neutral-border text-text-secondary text-xs rounded-sm"
              >
                {ing}
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

function CosmeticsProfileDisplay({ profile }) {
  const colors = profile.colors || [];
  if (!colors.length) return null;

  return (
    <div>
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">
        Color Family
      </h2>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <div key={color} className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full border border-white/10 shrink-0"
              style={{ background: COLOR_SWATCHES[color] || '#6B6B6B' }}
              aria-hidden="true"
            />
            <span className="text-xs text-text-secondary capitalize">{color}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category Pills ───────────────────────────────────────────────────────────

function CategoryPill({ label }) {
  return (
    <span className="inline-block border border-neutral-border text-text-muted text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-sm">
      {label}
    </span>
  );
}

// ─── Quantity Selector ────────────────────────────────────────────────────────

function QuantitySelector({ qty, setQty, max, disabled }) {
  const decrease = () => setQty((q) => Math.max(1, q - 1));
  const increase = () => setQty((q) => Math.min(max, q + 1));

  return (
    <div
      className="inline-flex items-center border border-neutral-border rounded-sm overflow-hidden"
      role="group"
      aria-label="Quantity selector"
    >
      <button
        onClick={decrease}
        disabled={disabled || qty <= 1}
        aria-label="Decrease quantity"
        className="w-11 h-11 flex items-center justify-center text-text-secondary hover:text-brand-gold hover:bg-surface-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span
        className="w-12 h-11 flex items-center justify-center text-text-primary text-sm font-medium border-x border-neutral-border select-none"
        aria-live="polite"
        aria-label={`Quantity: ${qty}`}
      >
        {qty}
      </span>

      <button
        onClick={increase}
        disabled={disabled || qty >= max}
        aria-label="Increase quantity"
        className="w-11 h-11 flex items-center justify-center text-text-secondary hover:text-brand-gold hover:bg-surface-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── ProductPage ──────────────────────────────────────────────────────────────

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState(false);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [qty, setQty] = useState(1);

  // ── Rating state ───────────────────────────────────────────────────────────
  const [userRating, setUserRating]           = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // ── Fetch product ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    // Clear stale recommendation state immediately on id change so the previous
    // product's data never shows while the new product's recommendations load.
    setRecommendations([]);
    setRecsError(false);

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
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
          const msg =
            err.response?.status === 404
              ? 'This product could not be found.'
              : 'Failed to load product. Please try again.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    return () => { cancelled = true; };
  }, [id]);

  // ── Fetch recommendations ──────────────────────────────────────────────────
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

  // ── Add to cart ────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;

    addItem(product, qty);
    toast.success(`${product.name} added to cart`, {
      duration: 2000,
      style: { background: '#16a34a', color: '#fff' },
    });
  };

  // ── Rate product ──────────────────────────────────────────────────────────
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
      toast.success('Rating submitted!', {
        duration: 2000,
        style: { background: '#16a34a', color: '#fff' },
      });
    } catch {
      toast.error('Failed to submit rating. Please try again.', {
        style: { background: '#dc2626', color: '#fff' },
      });
    } finally {
      setRatingSubmitting(false);
    }
  };

  // ── Render: loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <ProductPageSkeleton />
      </Layout>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <Layout>
        <ProductError message={error} />
      </Layout>
    );
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
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="opacity-40">/</li>
          <li>
            <Link to="/products" className="hover:text-brand-gold transition-colors">
              Products
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

            {/* OOS overlay */}
            {isOOS && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="border border-brand-gold/40 text-brand-gold/70 text-xs uppercase tracking-[0.25em] px-4 py-2">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* ── Right: Product info ───────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Brand */}
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              {product.brand}
            </p>

            {/* Product name */}
            <h1 className="text-3xl sm:text-4xl font-light text-text-primary leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <p
              className="text-3xl font-light text-brand-gold"
              aria-label={`Price: $${product.price.toFixed(2)}`}
            >
              ${product.price.toFixed(2)}
            </p>

            {/* Rating display */}
            <StarRating
              value={product.averageRating ?? 0}
              count={product.ratingCount  ?? 0}
              size="md"
            />

            {/* Stock status */}
            <div className="flex items-center gap-2" aria-live="polite">
              <span
                className={`w-2 h-2 rounded-full ${stockStatus.dotClass}`}
                aria-hidden="true"
              />
              <span className={`text-sm ${stockStatus.textClass}`}>
                {stockStatus.label}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-border" />

            {/* Category */}
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
                    ? 'Out of stock — cannot add to cart'
                    : `Add ${product.name} to cart`
                }
                className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-8 py-3 border text-sm uppercase tracking-widest font-medium transition-all duration-200
                  border-brand-gold text-brand-gold
                  hover:bg-brand-gold hover:text-brand-black
                  disabled:border-neutral-border disabled:text-text-muted disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                {isOOS ? 'Unavailable' : 'Add to Cart'}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-border" />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
                  {product.type === 'perfume' ? 'About this fragrance' : 'About this product'}
                </h2>
                <p className="text-text-muted leading-relaxed max-w-prose text-sm">
                  {product.description}
                </p>
              </div>
            )}

            {/* Category-specific profile */}
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
                Rate this product
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
                      Your rating: {userRating} star{userRating !== 1 ? 's' : ''} — click to update
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  <Link to="/login" className="text-brand-gold hover:underline">
                    Login
                  </Link>{' '}
                  to rate this product
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
          {/* Section header */}
          <div className="flex items-center gap-6 mb-2">
            <h2 className="text-xs uppercase tracking-[0.25em] text-text-muted whitespace-nowrap">
              Recommended for you
            </h2>
            <div
              className="flex-1 h-px"
              style={{
                background:
                  'linear-gradient(90deg, rgba(212,175,55,0.25), transparent)',
              }}
              aria-hidden="true"
            />
          </div>

          {/* Score hint — shown when we have results */}
          {!recsLoading && !recsError && recommendations.length > 0 && product?.type === 'perfume' && (
            <p className="text-[11px] text-text-muted mb-6">Highly similar scent profile</p>
          )}
          {!recsLoading && !recsError && recommendations.length > 0 && product?.type === 'skincare' && (
            <p className="text-[11px] text-text-muted mb-6">Shares key ingredients</p>
          )}
          {!recsLoading && !recsError && recommendations.length > 0 &&
            product?.type !== 'perfume' && product?.type !== 'skincare' && (
            <div className="mb-6" />
          )}

          {/* Error state */}
          {recsError && (
            <p className="text-sm text-text-muted py-6">Failed to load recommendations.</p>
          )}

          {/* Empty state — loaded but nothing returned */}
          {!recsLoading && !recsError && recommendations.length === 0 && (
            <p className="text-sm text-text-muted py-6">No recommendations available.</p>
          )}

          {/* Results */}
          {!recsError && (
            <ProductGrid products={recommendations} loading={recsLoading} />
          )}
        </section>
      )}

    </Layout>
  );
}