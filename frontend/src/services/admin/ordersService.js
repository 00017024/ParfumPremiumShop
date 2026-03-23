import api from '@/lib/api';

/**
 * Fetch all orders (admin only).
 * Supports optional query params: page, limit, status, search.
 */
export const fetchAllOrders = async (params = {}) => {
  const { data } = await api.get('/orders', { params });
  return data; // { orders, total, page, pages }
};

/**
 * Fetch a single order by ID (admin can access any order).
 */
export const fetchOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

/**
 * Update the status of an order.
 * Backend enforces valid transitions via canTransitionTo().
 */
export const updateOrderStatus = async (id, status) => {
  const { data } = await api.put(`/orders/${id}/status`, { status });
  return data;
};