import { useState, useEffect } from 'react';
import { fetchStats } from '@/services/admin/ordersService';
import i18n from '@/i18n';

/*
Single MongoDB aggregation pipeline on the backend — no bulk data transfer.
 */
export function useAdminStats() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStats();
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setError(i18n.t('admin.dashboard.load_error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}