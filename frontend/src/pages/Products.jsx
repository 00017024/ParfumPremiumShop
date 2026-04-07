import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/layout/Layout';
import SearchBar from '@/components/product/SearchBar';
import SortDropdown from '@/components/product/SortDropdown';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/product/Pagination';
import FilterPanel from '@/components/product/FilterPanel';
import toast from 'react-hot-toast';

const ACCORD_KEYS = ['woody', 'musky', 'sweet', 'citrus', 'floral', 'spicy', 'powdery', 'fresh'];
const FILTER_PARAM_KEYS = ['filterType', 'skinTypes', 'ingredients', 'colors', ...ACCORD_KEYS];
const ITEMS_PER_PAGE = 12;

// ─── Derive filter config from URL params ─────────────────────────────────────

function getFilterConfig(searchParams) {
  const filterType = searchParams.get('filterType');
  if (!filterType) return null;

  if (filterType === 'perfume') {
    const params = {};
    for (const key of ACCORD_KEYS) {
      const val = searchParams.get(key);
      if (val !== null) params[key] = parseFloat(val);
    }
    return { type: 'perfume', params };
  }
  if (filterType === 'skincare') {
    return {
      type: 'skincare',
      params: {
        skinTypes:   searchParams.get('skinTypes')?.split(',').filter(Boolean)   ?? [],
        ingredients: searchParams.get('ingredients')?.split(',').filter(Boolean) ?? [],
      },
    };
  }
  if (filterType === 'cosmetics') {
    return {
      type: 'cosmetics',
      params: { colors: searchParams.get('colors')?.split(',').filter(Boolean) ?? [] },
    };
  }
  return null;
}

// ─── Products page ────────────────────────────────────────────────────────────

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [totalPages, setTotalPages]     = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // URL-driven state
  const search     = searchParams.get('search') || '';
  const sort       = searchParams.get('sort')   || 'createdAt-desc';
  const page       = parseInt(searchParams.get('page') || '1');
  const filterConfig = useMemo(() => getFilterConfig(searchParams), [searchParams]);

  // Debounced search input
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateParams({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch]);

  // ── Normal fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (filterConfig) return;

    const controller = new AbortController();
    setLoading(true);

    const [sortField, sortOrder] = sort.split('-');

    api.get('/products', {
      signal: controller.signal,
      params: {
        search: search || undefined,
        sort: sortField,
        order: sortOrder,
        page,
        limit: ITEMS_PER_PAGE,
      },
    })
      .then(({ data }) => {
        setProducts(data.products);
        setTotalPages(data.pages);
      })
      .catch((error) => {
        if (error.name === 'CanceledError') return;
        toast.error('Failed to load products', { style: { background: '#dc2626', color: '#fff' } });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search, sort, page, filterConfig]);

  // ── Filter fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!filterConfig) return;

    const controller = new AbortController();
    setLoading(true);

    const { type, params } = filterConfig;
    let endpoint;
    let queryParams;

    if (type === 'perfume') {
      endpoint    = '/products/filter/perfume';
      queryParams = params; // accord keys sent directly
    } else if (type === 'skincare') {
      endpoint    = '/products/filter/skincare';
      queryParams = {
        ...(params.skinTypes?.length   && { skinTypes:   params.skinTypes.join(',') }),
        ...(params.ingredients?.length && { ingredients: params.ingredients.join(',') }),
      };
    } else {
      endpoint    = '/products/filter/cosmetics';
      queryParams = {
        ...(params.colors?.length && { colors: params.colors.join(',') }),
      };
    }

    api.get(endpoint, { signal: controller.signal, params: queryParams })
      .then(({ data }) => {
        setProducts(data.products);
        // Client-side pagination: total pages derived from result count
        setTotalPages(Math.max(1, Math.ceil(data.products.length / ITEMS_PER_PAGE)));
      })
      .catch((error) => {
        if (error.name === 'CanceledError') return;
        toast.error('Failed to apply filters', { style: { background: '#dc2626', color: '#fff' } });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [filterConfig]);

  // ── Client-side pagination for filter results ─────────────────────────────
  const displayedProducts = useMemo(() => {
    if (!filterConfig) return products; // backend already handles pagination
    const start = (page - 1) * ITEMS_PER_PAGE;
    return products.slice(start, start + ITEMS_PER_PAGE);
  }, [products, page, filterConfig]);

  // ── URL param helpers ─────────────────────────────────────────────────────

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort) => updateParams({ sort: newSort, page: 1 });

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Filter handlers ───────────────────────────────────────────────────────

  const handleFilterApply = ({ type, params }) => {
    const newParams = new URLSearchParams(searchParams);

    // Clear all existing filter params before writing new ones
    for (const key of FILTER_PARAM_KEYS) newParams.delete(key);
    newParams.set('filterType', type);
    newParams.set('page', '1');

    if (type === 'perfume') {
      for (const [k, v] of Object.entries(params)) {
        if (v > 0) newParams.set(k, String(v));
      }
    } else if (type === 'skincare') {
      if (params.skinTypes?.length)   newParams.set('skinTypes',   params.skinTypes.join(','));
      if (params.ingredients?.length) newParams.set('ingredients', params.ingredients.join(','));
    } else {
      if (params.colors?.length) newParams.set('colors', params.colors.join(','));
    }

    setSearchParams(newParams);
    setShowFilterPanel(false);
  };

  const handleFilterClear = () => {
    const newParams = new URLSearchParams(searchParams);
    for (const key of FILTER_PARAM_KEYS) newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
    setShowFilterPanel(false);
  };

  // ── Filter label ──────────────────────────────────────────────────────────

  const filterLabel = filterConfig
    ? `${filterConfig.type.charAt(0).toUpperCase() + filterConfig.type.slice(1)} filter active`
    : '';

  return (
    <Layout>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="bg-surface-dark border-b border-neutral-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row gap-4 items-center">

            {/* Search — always visible */}
            <SearchBar value={searchInput} onChange={setSearchInput} />

            {/* Sort — always visible */}
            <SortDropdown value={sort} onChange={handleSortChange} />

            {/* Active filter chip */}
            {filterConfig && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-2 px-3 py-2 bg-brand-gold/10 border border-brand-gold/40 rounded-sm text-sm text-brand-gold whitespace-nowrap">
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  {filterLabel}
                </span>
                <button
                  onClick={handleFilterClear}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-muted border border-neutral-border hover:border-text-secondary hover:text-text-primary transition-colors rounded-sm"
                  aria-label="Clear active filter"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  Clear
                </button>
              </div>
            )}

            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilterPanel((v) => !v)}
              aria-expanded={showFilterPanel}
              aria-controls="filter-panel"
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border transition-colors rounded-sm whitespace-nowrap shrink-0 ${
                showFilterPanel || filterConfig
                  ? 'border-brand-gold text-brand-gold'
                  : 'border-neutral-border text-text-secondary hover:border-brand-gold hover:text-brand-gold'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              Filters
            </button>

          </div>

          {/* Filter panel */}
          {showFilterPanel && (
            <div id="filter-panel" className="mt-4">
              <FilterPanel onApply={handleFilterApply} onClear={handleFilterClear} />
            </div>
          )}

        </div>
      </div>

      {/* ── Product Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {filterConfig && !loading && (
          <p className="text-sm text-text-muted mb-4">
            {products.length} {products.length === 1 ? 'result' : 'results'} found
          </p>
        )}

        <ProductGrid products={displayedProducts} loading={loading} />

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
