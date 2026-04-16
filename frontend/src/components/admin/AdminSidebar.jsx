import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  LogOut,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders',    icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/products',  icon: Package,         label: 'Products' },
  { to: '/admin/users',     icon: Users,           label: 'Users' },
  { to: '/admin/analytics', icon: MapPin,          label: 'Analytics' },
];

const activeClass =
  'bg-brand-gold/10 text-brand-gold border-l-2 border-brand-gold';
const inactiveClass =
  'text-text-secondary hover:text-text-primary hover:bg-surface-dark border-l-2 border-transparent';

/**
 * Admin sidebar.
 *
 * @param {boolean}  mobileOpen 
 * @param {function} onClose 
 */
export default function AdminSidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Branding */}
      <div className="h-16 flex items-center px-5 border-b border-neutral-border flex-shrink-0">
        <span className="text-base font-bold text-brand-gold tracking-wide">
          PARFUM
        </span>
        <span className="text-base font-light text-text-secondary tracking-wide ml-1">
          ADMIN
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-r-sm ${
                    isActive ? activeClass : inactiveClass
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-neutral-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-gold text-xs font-semibold">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-primary truncate">{user?.name}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Admin</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          Sign out
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar — always visible ───────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 bg-surface-dark border-r border-neutral-border h-full flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <aside className="relative flex flex-col w-56 bg-surface-dark border-r border-neutral-border h-full z-10">
            {/* Close button (mobile only) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}