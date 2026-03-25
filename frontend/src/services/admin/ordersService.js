import api from '@/lib/api';

/*
Fetch all orders (admin only).
 */
export const fetchAllOrders = async (params = {}) => {
  const { data } = await api.get('/orders', { params });
  return data; // { orders, total, page, pages }
};

/*
Fetch a single order by ID
 */
export const fetchOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

/*
Update the status of an order.
 */
export const updateOrderStatus = async (id, status) => {
  const { data } = await api.put(`/orders/${id}/status`, { status });
  return data;
};

/*
Fetch aggregated admin dashboard stats.
 */
export const fetchStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};