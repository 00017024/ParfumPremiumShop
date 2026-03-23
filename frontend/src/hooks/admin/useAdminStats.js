import { useState, useEffect } from 'react';
import { fetchAllOrders } from '@/services/admin/ordersService';
import { fetchAllProducts } from '@/services/admin/productsService';
import { fetchAllUsers } from '@/services/admin/usersService';

/**
 * Aggregates summary stats for the admin dashboard overview.
 * Runs three parallel requests and derives metrics client-side.
 *
 * In a production app with high data volume, this logic would live
 * in a dedicated backend endpoint (e.g. GET /admin/stats).
 * For now, the frontend derives it from existing endpoints.
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
        const [ordersResult, productsResult, usersResult] = await Promise.all([
          fetchAllOrders({ limit: 1000 }), // fetch enough to compute revenue
          fetchAllProducts({ limit: 1 }),  // only need the total count
          fetchAllUsers(),
        ]);

        if (cancelled) return;

        const orders = Array.isArray(ordersResult)
          ? ordersResult
          : (ordersResult.orders ?? []);

        const totalRevenue = orders
          .filter((o) => o.status !== 'CANCELLED')
          .reduce((sum, o) => sum + (o.totalPrice ?? 0), 0);

        const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

        const recentOrders = [...orders]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setStats({
          totalOrders: Array.isArray(ordersResult)
            ? ordersResult.length
            : (ordersResult.total ?? orders.length),
          totalRevenue,
          pendingOrders: pendingCount,
          totalProducts: Array.isArray(productsResult)
            ? productsResult.length
            : (productsResult.total ?? 0),
          totalUsers: Array.isArray(usersResult) ? usersResult.length : 0,
          recentOrders,
        });
      } catch {
        if (!cancelled) setError('Failed to load dashboard stats.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}