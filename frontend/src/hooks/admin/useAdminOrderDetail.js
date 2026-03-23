import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { fetchOrderById, updateOrderStatus } from '@/services/admin/ordersService';

/**
 * Manages a single order's data and status update for the detail page.
 *
 * @param {string} id - The order's MongoDB _id.
 */
export function useAdminOrderDetail(id) {
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderById(id);
      setOrder(data);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load order.';
      setError(message);
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = useCallback(async (newStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      await updateOrderStatus(id, newStatus);
      setOrder((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus}`, {
        style: { background: '#16a34a', color: '#fff' },
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update status.';
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setUpdating(false);
    }
  }, [id, order]);

  return { order, loading, error, updating, reload: load, changeStatus };
}