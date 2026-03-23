import { Link } from 'react-router-dom';
import { ShoppingCart, User, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/store/cartStore';

export default function Header() {
  const { user, logout } = useAuth();
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const cartItemCount = getTotalItems();

  return (
    <header className="bg-brand-black border-b border-neutral-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-brand-gold tracking-wide hover:opacity-80 transition-opacity">
          PARFUM PREMIUM
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors">
            Home
          </Link>
          <Link to="/products" className="text-text-secondary hover:text-text-primary transition-colors">
            Shop
          </Link>
          {user && (
            <Link to="/orders" className="text-text-secondary hover:text-text-primary transition-colors">
              My Orders
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-6">
          {/* Cart */}
          <Link to="/cart" className="relative group">
            <ShoppingCart className="w-6 h-6 text-text-secondary group-hover:text-text-primary transition-colors" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-gold text-brand-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {cartItemCount}
              </span>
            )}
          </Link>
            {user?.role === 'admin' && (
          <Link to="/admin" className="text-brand-gold text-sm">Admin</Link>
           )}

          {/* User */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-text-primary text-sm hidden sm:block">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
              <User className="w-6 h-6" />
              <span className="hidden sm:block text-sm">Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}