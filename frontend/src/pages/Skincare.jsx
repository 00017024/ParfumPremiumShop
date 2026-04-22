import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import toast from 'react-hot-toast';

/**
 * Purpose: Skincare category page; fetches all skincare products and renders a product grid.
 */
export default function Skincare() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    api.get('/products', {
      signal: controller.signal,
      params: { type: 'skincare', limit: 100 },
    })
      .then(({ data }) => setProducts(data.products))
      .catch((err) => {
        if (err.name === 'CanceledError') return;
        toast.error(t('errors.load_skincare'), { style: { background: '#dc2626', color: '#fff' } });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [t]);

  return (
    <Layout>

      <div className="bg-surface-dark border-b border-neutral-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-text-primary">{t('pages.skincare')}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && (
          <p className="text-sm text-text-muted mb-4">
            {t(products.length === 1 ? 'pages.products_count_one' : 'pages.products_count_other', { count: products.length })}
          </p>
        )}
        <ProductGrid products={products} loading={loading} />
      </div>

    </Layout>
  );
}
