import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import toast from 'react-hot-toast';

export default function Cosmetics() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    api.get('/products', {
      signal: controller.signal,
      params: { type: 'cosmetics', limit: 100 },
    })
      .then(({ data }) => setProducts(data.products))
      .catch((err) => {
        if (err.name === 'CanceledError') return;
        toast.error('Failed to load cosmetics', { style: { background: '#dc2626', color: '#fff' } });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <Layout>

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div className="bg-surface-dark border-b border-neutral-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-text-primary">Cosmetics</h1>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && (
          <p className="text-sm text-text-muted mb-4">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        )}
        <ProductGrid products={products} loading={loading} />
      </div>

    </Layout>
  );
}
