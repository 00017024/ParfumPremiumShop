import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Home } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

/**
 * AdminLayout — persistent shell for all admin pages.
 *
 * Structure:
 *   ┌─────────────────────────────────────────┐
 *   │  Sidebar (desktop fixed, mobile drawer)  │
 *   │  ┌───────────────────────────────────┐   │
 *   │  │  Top bar (mobile only)            │   │
 *   │  │  <Outlet /> (page content)        │   │
 *   │  └───────────────────────────────────┘   │
 *   └─────────────────────────────────────────┘
 */
export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-brand-black">

      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* ── Top bar (mobile only) ───────────────────────────────── */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-surface-dark border-b border-neutral-border flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-text-secondary hover:text-text-primary p-1"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="text-sm font-bold text-brand-gold tracking-wide">
            PARFUM ADMIN
          </span>

          <Link
            to="/products"
            className="text-text-muted hover:text-brand-gold transition-colors p-1"
            title="Go to storefront"
            aria-label="Go to storefront"
          >
            <Home className="w-4 h-4" />
          </Link>
        </header>

        {/* ── Page content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
}