import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import Layout from '@/components/layout/Layout';
import SearchBar from '@/components/product/SearchBar';
import SortDropdown from '@/components/product/SortDropdown';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/product/Pagination';
import toast from 'react-hot-toast';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Get params from URL or defaults
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'createdAt-desc';
  const page = parseInt(searchParams.get('page') || '1');

  // Debounced search
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateParams({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch]);

  // Fetch products
  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const [sortField, sortOrder] = sort.split('-');

        const response = await api.get('/products', {
          signal: controller.signal,
          params: {
            search: search || undefined,
            sort: sortField,
            order: sortOrder,
            page,
            limit: 12,
          },
        });

        setProducts(response.data.products);
        setTotalPages(response.data.pages);
      } catch (error) {
        if (error.name === 'CanceledError') return; // ignore aborted requests
        toast.error('Failed to load products', {
          style: { background: '#dc2626', color: '#fff' },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [search, sort, page]);

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort) => {
    updateParams({ sort: newSort, page: 1 });
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      {/* Search & Filter Bar */}
      <div className="bg-surface-dark border-b border-neutral-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <SearchBar value={searchInput} onChange={setSearchInput} />
            <SortDropdown value={sort} onChange={handleSortChange} />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductGrid products={products} loading={loading} />
        
        {!loading && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </Layout>
  );
}