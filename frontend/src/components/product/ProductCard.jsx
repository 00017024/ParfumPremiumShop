import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import StarRating from '@/components/product/StarRating';

/**
 * Purpose: Renders a product tile with image, brand, name, price, star rating, and add-to-cart button.
 * Input: product – product document from the API
 */
export default function ProductCard({ product }) {
  const { t } = useTranslation();
  const addItem = useCartStore((state) => state.addItem);

  const isOutOfStock = product.stock === 0;

  /**
   * Purpose: Adds one unit to the cart and shows a success toast; prevents the parent link navigation.
   */
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    addItem(product, 1);

    toast.success(t('product.added_to_cart_toast', { name: product.name }), {
      duration: 2000,
      style: { background: '#16a34a', color: '#fff' },
    });
  };

  const imageFallback = `https://placehold.co/600x600/2A2A2A/D4AF37?text=${encodeURIComponent(product.brand)}`;

  return (
    <div className="bg-surface-card rounded-lg overflow-hidden border border-neutral-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">

      {/* Image + Link */}
      <Link to={`/products/${product._id}`}>
        <div className="aspect-square bg-surface-dark relative overflow-hidden">
          <img
            src={product.imageUrl || imageFallback}
            alt={`${product.brand} ${product.name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {isOutOfStock && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              {t('product.sold_out')}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-2">

        {/* Brand */}
        <p className="text-xs uppercase tracking-wider text-text-muted">
          {product.brand}
        </p>

        {/* Name → clickable */}
        <Link to={`/products/${product._id}`}>
          <h3 className="text-base font-medium text-text-primary line-clamp-2 min-h-[3rem] hover:text-brand-gold transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <p className="text-2xl font-bold text-brand-gold">
          ${Number(product.price).toFixed(2)}
        </p>

        {/* Rating */}
        <StarRating
          value={product.averageRating ?? 0}
          count={product.ratingCount  ?? 0}
        />

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full bg-brand-gold text-brand-black font-semibold py-3 rounded-lg hover:bg-opacity-90 transition-all disabled:bg-neutral-border disabled:text-text-muted disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {isOutOfStock ? t('product.out_of_stock') : t('product.add_to_cart')}
        </button>

      </div>
    </div>
  );
}
