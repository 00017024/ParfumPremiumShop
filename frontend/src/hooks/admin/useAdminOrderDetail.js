import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { fetchOrderById, updateOrderStatus } from '@/services/admin/ordersService';
import i18n from '@/i18n';

/**
 * Purpose: Fetches a single order and exposes a changeStatus action for the admin detail page.
 * Input: id – the order's MongoDB _id
 * Output: { order, loading, error, updating, reload, changeStatus }
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
      const message = i18n.t('admin.order_detail.load_error');
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
      toast.success(i18n.t('admin.order_detail.status_updated', { status: i18n.t(`admin.status.${newStatus}`, { defaultValue: newStatus }) }), {
        style: { background: '#16a34a', color: '#fff' },
      });
    } catch (err) {
      const message = i18n.t('admin.orders.update_error');
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setUpdating(false);
    }
  }, [id, order]);

  return { order, loading, error, updating, reload: load, changeStatus };
}