import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { label: 'All',   value: null },
  { label: 'Men',   value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
];

export default function Perfumes() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    api.get('/products', {
      signal: controller.signal,
      params: {
        type: 'perfume',
        limit: 100,
        ...(category && { category }),
      },
    })
      .then(({ data }) => setProducts(data.products))
      .catch((err) => {
        if (err.name === 'CanceledError') return;
        toast.error('Failed to load perfumes', { style: { background: '#dc2626', color: '#fff' } });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [category]);

  return (
    <Layout>

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div className="bg-surface-dark border-b border-neutral-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center gap-4">

          <h1 className="text-xl font-semibold text-text-primary shrink-0">Perfumes</h1>

          {/* Category filter */}
          <div className="flex gap-2">
            {CATEGORIES.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setCategory(value)}
                className={`px-4 py-2 text-sm rounded-sm border transition-colors ${
                  category === value
                    ? 'border-brand-gold text-brand-gold bg-brand-gold/10'
                    : 'border-neutral-border text-text-secondary hover:border-brand-gold hover:text-brand-gold'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

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
