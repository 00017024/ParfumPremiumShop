import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

import Layout from '@/components/layout/Layout';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <section
        className="flex items-center justify-center min-h-[70vh] px-4 py-16"
        aria-label="Page not found"
      >
        <div className="max-w-md w-full flex flex-col items-center text-center gap-6">

          {/* Icon */}
          <Compass className="w-16 h-16 text-brand-gold opacity-80" aria-hidden="true" />

          {/* Status + heading */}
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
              404
            </p>
            <h1 className="text-3xl font-light text-text-primary tracking-wide">
              Page Not Found
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              The page you're looking for doesn't exist or may have been moved.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-neutral-border" />

          {/* Actions */}
          <nav
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            aria-label="Recovery options"
          >
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back to the previous page"
              className="flex items-center justify-center gap-2 px-8 py-3 text-sm uppercase tracking-widest font-medium border border-neutral-border text-text-secondary hover:border-brand-gold hover:text-brand-gold transition-all duration-200 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Go Back
            </button>

            <Link
              to="/products"
              aria-label="Browse our products"
              className="flex items-center justify-center px-8 py-3 text-sm uppercase tracking-widest font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 transition-all duration-200 active:scale-[0.98]"
            >
              Browse Products
            </Link>
          </nav>

        </div>
      </section>
    </Layout>
  );
}