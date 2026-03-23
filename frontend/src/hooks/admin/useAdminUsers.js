import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  fetchAllUsers,
  blockUser,
  unblockUser,
} from '@/services/admin/usersService';

/**
 * Manages admin user list with block/unblock operations.
 */
export function useAdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load users.';
      setError(message);
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setLoading(false);
    }
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
        toast.success('User blocked.', {
          style: { background: '#16a34a', color: '#fff' },
        });
      } else {
        await unblockUser(userId);
        toast.success('User unblocked.', {
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
      const message = err.response?.data?.message || 'Action failed.';
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setTogglingId(null);
    }
  }, []);

  return { users, loading, error, togglingId, reload: load, toggleBlock };
}