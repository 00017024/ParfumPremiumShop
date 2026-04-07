import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  fetchAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/services/admin/productsService';

/**
 * Manages admin product list with create, update, delete operations.
 */
export function useAdminProducts(initialParams = { page: 1, limit: 12 }) {
  const [products, setProducts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [params, setParams]       = useState(initialParams);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllProducts(params);
      setProducts(result.products ?? []);
      setTotal(result.total ?? 0);
      setPages(result.pages ?? 1);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load products.';
      setError(message);
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const addProduct = useCallback(async (payload) => {
    setSubmitting(true);
    try {
      const newProduct = await createProduct(payload);
      toast.success('Product created successfully.', {
        style: { background: '#16a34a', color: '#fff' },
      });
      await load();
      return { success: true, product: newProduct };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create product.';
      const details = err.response?.data?.details ?? [];
      // Only toast the summary — per-field detail is handled by the form.
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
      return { success: false, message, details };
    } finally {
      setSubmitting(false);
    }
  }, [load]);

  const editProduct = useCallback(async (id, payload) => {
    setSubmitting(true);
    try {
      const updated = await updateProduct(id, payload);
      setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      toast.success('Product updated.', {
        style: { background: '#16a34a', color: '#fff' },
      });
      return { success: true, product: updated };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update product.';
      const details = err.response?.data?.details ?? [];
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
      return { success: false, message, details };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const removeProduct = useCallback(async (id) => {
    setSubmitting(true);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setTotal((prev) => prev - 1);
      toast.success('Product deleted.', {
        style: { background: '#16a34a', color: '#fff' },
      });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete product.';
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateParams = useCallback((updates) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    products,
    total,
    pages,
    params,
    loading,
    error,
    submitting,
    reload: load,
    addProduct,
    editProduct,
    removeProduct,
    updateParams,
  };
}