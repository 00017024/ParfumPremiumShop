import api from '@/lib/api';

/**
 * Fetch paginated product list.
 */
export const fetchAllProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data; // { products, total, page, pages }
};

/**
 * Create a new product.
 */
export const createProduct = async (payload) => {
  const { data } = await api.post('/products', payload);
  return data;
};

/**
 * Update an existing product by ID.
 */
export const updateProduct = async (id, payload) => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
};

/**
 * Permanently delete a product by ID.
 */
export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};