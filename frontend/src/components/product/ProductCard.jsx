import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    addItem(product, 1);
    toast.success(`${product.name} added to cart!`, {
      duration: 2000,
      style: {
        background: '#16a34a',
        color: '#fff',
      },
    });
  };

  return (
    <div className="bg-surface-card rounded-lg overflow-hidden border border-neutral-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      {/* Image */}
      <div className="aspect-square bg-surface-dark relative overflow-hidden">
        <img
          src={product.imageUrl || `https://placehold.co/600x600/2A2A2A/D4AF37?text=${encodeURIComponent(product.brand)}`}
          alt={`${product.brand} ${product.name}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            Sold Out
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Brand */}
        <p className="text-xs uppercase tracking-wider text-text-muted">
          {product.brand}
        </p>

        {/* Product Name */}
        <h3 className="text-base font-medium text-text-primary line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-2xl font-bold text-brand-gold">
          ${product.price.toFixed(2)}
        </p>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full bg-brand-gold text-brand-black font-semibold py-3 rounded-lg hover:bg-opacity-90 transition-all disabled:bg-neutral-border disabled:text-text-muted disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}