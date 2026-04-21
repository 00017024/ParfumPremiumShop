import { useState, useEffect } from 'react';
import api from '@/lib/api';
import i18n from '@/i18n';

/**
 * Fetches the /admin/analytics payload once on mount.
 * Mirrors the same cancellation + loading pattern as useAdminStats.
 */
export function useAdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/admin/analytics');
        if (!cancelled) setAnalytics(data);
      } catch {
        if (!cancelled) setError(i18n.t('admin.analytics.load_error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { analytics, loading, error };
}
