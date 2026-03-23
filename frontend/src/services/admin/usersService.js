import api from '@/lib/api';

/**
 * Fetch all registered users (admin only).
 */
export const fetchAllUsers = async () => {
  const { data } = await api.get('/admin/users');
  return data; // array of user objects
};

/**
 * Block a user account (sets isActive: false).
 */
export const blockUser = async (id) => {
  const { data } = await api.post(`/admin/users/${id}/block`);
  return data;
};

/**
 * Unblock a user account (sets isActive: true).
 */
export const unblockUser = async (id) => {
  const { data } = await api.post(`/admin/users/${id}/unblock`);
  return data;
};

/**
 * Update user fields (name, role, etc.) — password is stripped on the backend.
 */
export const updateUser = async (id, payload) => {
  const { data } = await api.put(`/admin/users/${id}`, payload);
  return data;
};