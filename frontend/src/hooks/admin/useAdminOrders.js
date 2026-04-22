import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  fetchAllOrders,
  updateOrderStatus,
} from '@/services/admin/ordersService';
import i18n from '@/i18n';

/**
 * Purpose: Manages the paginated admin orders list with in-place status updates.
 * Input: initialParams – initial query params { page, limit, status? }
 * Output: { orders, total, pages, params, loading, error, setParams, reload, changeStatus }
 */
export function useAdminOrders(initialParams = { page: 1, limit: 15 }) {
  const [orders, setOrders]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [params, setParams]         = useState(initialParams);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [updatingId, setUpdatingId] = useState(null); // which order is being updated

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllOrders(params);
      // Backend returns { orders, total, page, pages } OR an array — handle both
      if (Array.isArray(result)) {
        setOrders(result);
        setTotal(result.length);
        setPages(1);
      } else {
        setOrders(result.orders ?? result);
        setTotal(result.total ?? 0);
        setPages(result.pages ?? 1);
      }
    } catch (err) {
      const message = i18n.t('admin.orders.load_error');
      setError(message);
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Update an order's status.
   * Applies an optimistic update locally so the UI responds instantly,
   * then refetches on success, or rolls back on failure.
   */
  const changeStatus = useCallback(async (orderId, newStatus) => {
    const previous = orders.find((o) => o._id === orderId)?.status;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
    );
    setUpdatingId(orderId);

    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(i18n.t('admin.orders.status_updated', { status: i18n.t(`admin.status.${newStatus}`, { defaultValue: newStatus }) }), {
        style: { background: '#16a34a', color: '#fff' },
      });
    } catch (err) {
      // Roll back
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: previous } : o))
      );
      const message = i18n.t('admin.orders.update_error');
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setUpdatingId(null);
    }
  }, [orders]);

  const updateParams = useCallback((updates) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    orders,
    total,
    pages,
    params,
    loading,
    error,
    updatingId,
    reload: load,
    changeStatus,
    updateParams,
  };
}