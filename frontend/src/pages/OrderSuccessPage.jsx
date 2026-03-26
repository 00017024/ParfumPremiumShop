import { Link, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

import Layout from '@/components/layout/Layout';

export default function OrderSuccessPage() {
  const { state } = useLocation();

  // Redirect away if user navigated here directly without placing an order
  if (!state?.fromCheckout) {
    return <Navigate to="/orders" replace />;
  }

  return (
    <Layout>
      <section
        className="flex items-center justify-center min-h-[70vh] px-4 py-16"
        aria-label="Order confirmation"
      >
        <div className="max-w-lg w-full flex flex-col items-center text-center gap-6">

          {/* Icon */}
          <CheckCircle className="w-16 h-16 text-brand-gold" aria-hidden="true" />

          {/* Heading */}
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-light text-text-primary tracking-wide">
              Order Confirmed
            </h1>
            <p className="text-text-secondary">
              Your order has been successfully placed.
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              Our team will contact you shortly to confirm delivery details.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-neutral-border" />

          {/* Actions */}
          <nav
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            aria-label="Next steps"
          >
            <Link
              to="/products"
              aria-label="Continue shopping"
              className="flex items-center justify-center px-8 py-3 text-sm uppercase tracking-widest font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 transition-all duration-200 active:scale-[0.98]"
            >
              Continue Shopping
            </Link>

            <Link
              to="/orders"
              aria-label="View my orders"
              className="flex items-center justify-center px-8 py-3 text-sm uppercase tracking-widest font-medium border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-black transition-all duration-200 active:scale-[0.98]"
            >
              View My Orders
            </Link>
          </nav>

        </div>
      </section>
    </Layout>
  );
}