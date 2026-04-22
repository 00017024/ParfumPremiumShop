import { Fragment } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/store/cartStore';

const LANGS = ['en', 'ru', 'uz'];
const STORAGE_KEY = 'parfum_lang';

/**
 * Purpose: Renders EN | RU | UZ buttons and persists the selected language to localStorage.
 */
function LanguageSwitcher() {
  const { i18n } = useTranslation();

  /** Purpose: Switches the active language and writes the preference to localStorage. */
  const change = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <div className="flex items-center gap-1 text-xs select-none">
      {LANGS.map((lang, idx) => (
        <Fragment key={lang}>
          <button
            onClick={() => change(lang)}
            className={`uppercase tracking-wide transition-colors ${
              i18n.language === lang
                ? 'text-brand-gold font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {lang}
          </button>
          {idx < LANGS.length - 1 && (
            <span className="text-neutral-border" aria-hidden="true">|</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Purpose: Sticky top navigation with logo, category links, language switcher, cart badge, and user actions.
 */
export default function Header() {
  const { t } = useTranslation();
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
          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive ? 'text-brand-gold transition-colors' : 'text-text-secondary hover:text-text-primary transition-colors'
            }
          >
            {t('nav.home')}
          </NavLink>
          <NavLink
            to="/perfumes"
            className={({ isActive }) =>
              isActive ? 'text-brand-gold transition-colors' : 'text-text-secondary hover:text-text-primary transition-colors'
            }
          >
            {t('nav.perfumes')}
          </NavLink>
          <NavLink
            to="/skincare"
            className={({ isActive }) =>
              isActive ? 'text-brand-gold transition-colors' : 'text-text-secondary hover:text-text-primary transition-colors'
            }
          >
            {t('nav.skincare')}
          </NavLink>
          <NavLink
            to="/cosmetics"
            className={({ isActive }) =>
              isActive ? 'text-brand-gold transition-colors' : 'text-text-secondary hover:text-text-primary transition-colors'
            }
          >
            {t('nav.cosmetics')}
          </NavLink>
          {user && (
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                isActive ? 'text-brand-gold transition-colors' : 'text-text-secondary hover:text-text-primary transition-colors'
              }
            >
              {t('nav.my_orders')}
            </NavLink>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <LanguageSwitcher />

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
            <Link to="/admin" className="text-brand-gold text-sm">{t('nav.admin')}</Link>
          )}

          {/* User */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="text-text-primary text-sm hidden sm:block hover:text-brand-gold transition-colors"
              >
                {user.name}
              </Link>
              <button
                onClick={logout}
                className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
              <User className="w-6 h-6" />
              <span className="hidden sm:block text-sm">{t('nav.login')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
