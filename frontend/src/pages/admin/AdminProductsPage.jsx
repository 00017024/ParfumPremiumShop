import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, RotateCcw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAdminProducts } from '@/hooks/admin/useAdminProducts';
import { useDebounce } from '@/hooks/useDebounce';
import ProductFormModal from '@/components/admin/ProductFormModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-neutral-border animate-pulse">
      {[48, 160, 120, 80, 60, 80, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          {i === 0 ? (
            <div className="w-10 h-10 bg-surface-dark rounded-sm" />
          ) : (
            <div className="h-3 bg-surface-dark rounded" style={{ width: w }} />
          )}
        </td>
      ))}
    </tr>
  );
}

// ─── AdminProductsPage ────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const {
    products,
    total,
    pages,
    params,
    loading,
    error,
    submitting,
    reload,
    addProduct,
    editProduct,
    removeProduct,
    updateParams,
  } = useAdminProducts({ page: 1, limit: 12 });

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // ── Delete confirmation state ──────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Search ─────────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(params.search ?? '');
  const debouncedSearch = useDebounce(searchInput, 350);

  useEffect(() => {
    updateParams({ search: debouncedSearch || undefined, page: 1 });
  }, [debouncedSearch]);

  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    let result;
    if (editingProduct) {
      result = await editProduct(editingProduct._id, payload);
    } else {
      result = await addProduct(payload);
    }
    if (result.success) {
      setModalOpen(false);
      setEditingProduct(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await removeProduct(deleteTarget._id);
    setDeleting(false);
    if (result.success) setDeleteTarget(null);
  };

  const COLUMNS = [
    t('admin.products.col_image'),
    t('admin.products.col_name'),
    t('admin.products.col_brand'),
    t('admin.products.col_price'),
    t('admin.products.col_stock'),
    t('admin.products.col_category'),
    t('admin.products.col_actions'),
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-text-primary tracking-wide">
            {t('admin.products.title')}
          </h1>
          {!loading && (
            <p className="text-sm text-text-muted mt-1">
              {t('admin.products.total', { count: total })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reload}
            disabled={loading}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-brand-gold transition-colors disabled:opacity-40"
            aria-label={t('admin.products.refresh')}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.products.refresh')}
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-black text-sm font-medium hover:bg-opacity-90 transition-all rounded-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('admin.products.add')}
          </button>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          placeholder={t('admin.products.search_placeholder')}
          value={searchInput}
          onChange={handleSearchChange}
          className="w-full bg-surface-card border border-neutral-border rounded-sm pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors"
        />
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-surface-card border border-neutral-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t('admin.products.title')}>
            <thead>
              <tr className="border-b border-neutral-border">
                {COLUMNS.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-text-muted font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : products.length === 0
                ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-text-muted"
                    >
                      {t('admin.products.no_products')}
                    </td>
                  </tr>
                )
                : products.map((product) => {
                  const fallback = `https://placehold.co/40x40/2A2A2A/D4AF37?text=${encodeURIComponent(product.brand?.[0] ?? '?')}`;

                  return (
                    <tr
                      key={product._id}
                      className="border-b border-neutral-border last:border-0 hover:bg-surface-dark/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-sm overflow-hidden bg-surface-dark flex-shrink-0">
                          <img
                            src={product.imageUrl || fallback}
                            alt={product.name}
                            onError={(e) => { e.currentTarget.src = fallback; }}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-text-primary font-medium line-clamp-1 max-w-[180px] block">
                          {product.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {product.brand}
                      </td>
                      <td className="px-4 py-3 text-brand-gold whitespace-nowrap">
                        ${Number(product.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={
                            product.stock === 0
                              ? 'text-red-400'
                              : product.stock <= 5
                              ? 'text-yellow-400'
                              : 'text-text-secondary'
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {product.category
                          ? (
                            <span className="text-[10px] uppercase tracking-wider border border-neutral-border text-text-muted px-1.5 py-0.5 rounded-sm">
                              {product.category}
                            </span>
                          )
                          : <span className="text-xs text-text-muted italic">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 text-text-muted hover:text-brand-gold transition-colors rounded-sm hover:bg-brand-gold/10"
                            aria-label={`${t('admin.products.col_actions')} ${product.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({ _id: product._id, name: product.name })
                            }
                            className="p-1.5 text-text-muted hover:text-red-400 transition-colors rounded-sm hover:bg-red-500/10"
                            aria-label={`${t('admin.products.delete_confirm')} ${product.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => updateParams({ page: params.page - 1 })}
            disabled={params.page <= 1}
            className="px-3 py-1.5 text-xs border border-neutral-border text-text-secondary hover:border-brand-gold transition-all rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('pagination.previous')}
          </button>
          <span className="text-xs text-text-muted px-2">
            {params.page} / {pages}
          </span>
          <button
            onClick={() => updateParams({ page: params.page + 1 })}
            disabled={params.page >= pages}
            className="px-3 py-1.5 text-xs border border-neutral-border text-text-secondary hover:border-brand-gold transition-all rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('pagination.next')}
          </button>
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────── */}
      <ProductFormModal
        open={modalOpen}
        product={editingProduct}
        submitting={submitting}
        onSave={handleSave}
        onClose={() => {
          if (!submitting) {
            setModalOpen(false);
            setEditingProduct(null);
          }
        }}
      />

      {/* ── Delete Confirmation ──────────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('admin.products.delete_title')}
        description={
          deleteTarget
            ? t('admin.products.delete_description', { name: deleteTarget.name })
            : ''
        }
        confirmLabel={t('admin.products.delete_confirm')}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />

    </div>
  );
}
