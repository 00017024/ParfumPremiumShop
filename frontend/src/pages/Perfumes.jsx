import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import toast from 'react-hot-toast';

// Category values are backend params — labels come from i18n
const CATEGORY_VALUES = [null, 'men', 'women', 'unisex'];

export default function Perfumes() {
  const { t } = useTranslation();
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
        toast.error(t('errors.load_perfumes'), { style: { background: '#dc2626', color: '#fff' } });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [category, t]);

  const categoryLabel = (value) => {
    if (value === null) return t('category.all');
    return t(`category.${value}`);
  };

  return (
    <Layout>

      <div className="bg-surface-dark border-b border-neutral-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center gap-4">

          <h1 className="text-xl font-semibold text-text-primary shrink-0">{t('pages.perfumes')}</h1>

          <div className="flex gap-2">
            {CATEGORY_VALUES.map((value) => (
              <button
                key={String(value)}
                onClick={() => setCategory(value)}
                className={`px-4 py-2 text-sm rounded-sm border transition-colors ${
                  category === value
                    ? 'border-brand-gold text-brand-gold bg-brand-gold/10'
                    : 'border-neutral-border text-text-secondary hover:border-brand-gold hover:text-brand-gold'
                }`}
              >
                {categoryLabel(value)}
              </button>
            ))}
          </div>

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
