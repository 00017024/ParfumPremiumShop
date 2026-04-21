import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  fetchAllUsers,
  blockUser,
  unblockUser,
} from '@/services/admin/usersService';
import i18n from '@/i18n';

/**
 * Manages admin user list with block/unblock operations.
 */
export function useAdminUsers(initialParams = { page: 1, limit: 20 }) {
  const [users, setUsers]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [params, setParams]         = useState(initialParams);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsers(params);
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err) {
      const message = i18n.t('admin.users.load_error');
      setError(message);
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((updates) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Toggle a user's active state.
   * Applies optimistic update; rolls back on failure.
   */
  const toggleBlock = useCallback(async (userId, currentlyActive) => {
    setTogglingId(userId);

    // Optimistic
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, isActive: !currentlyActive } : u
      )
    );

    try {
      if (currentlyActive) {
        await blockUser(userId);
        toast.success(i18n.t('admin.users.block_success'), {
          style: { background: '#16a34a', color: '#fff' },
        });
      } else {
        await unblockUser(userId);
        toast.success(i18n.t('admin.users.unblock_success'), {
          style: { background: '#16a34a', color: '#fff' },
        });
      }
    } catch (err) {
      // Roll back
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: currentlyActive } : u
        )
      );
      const message = i18n.t('admin.users.action_error');
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setTogglingId(null);
    }
  }, []);

  return { users, total, pages, params, loading, error, togglingId, reload: load, toggleBlock, updateParams };
}