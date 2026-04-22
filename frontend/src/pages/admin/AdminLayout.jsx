import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-brand-black">

      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-surface-dark border-b border-neutral-border flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-text-secondary hover:text-text-primary p-1"
            aria-label={t('admin.sidebar.open_nav')}
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="text-sm font-bold text-brand-gold tracking-wide">
            {t('admin.sidebar.brand')}
          </span>

          <Link
            to="/products"
            className="text-text-muted hover:text-brand-gold transition-colors p-1"
            title={t('admin.sidebar.storefront')}
            aria-label={t('admin.sidebar.storefront')}
          >
            <Home className="w-4 h-4" />
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
}