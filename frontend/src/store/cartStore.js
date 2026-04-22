import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Purpose: Zustand store for the shopping cart; persisted to localStorage under 'cart-storage'.
 * Output: { items, addItem, removeItem, updateQuantity, updateProduct, clearCart, getTotalPrice, getTotalItems }
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      /** Purpose: Adds a product or increments its quantity; clamps to available stock. */
      addItem: (product, quantity = 1) => set((state) => {
        const existing = state.items.find(i => i.product._id === product._id);
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, product.stock);
          return {
            items: state.items.map(i =>
              i.product._id === product._id
                ? { ...i, quantity: newQty }
                : i
            )
          };
        }
        const clampedQty = Math.min(quantity, product.stock);
        if (clampedQty <= 0) return state; // out of stock — don't add
        return { items: [...state.items, { product, quantity: clampedQty }] };
      }),
      
      /** Purpose: Removes a cart line by product ID. */
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.product._id !== productId)
      })),
      
      /** Purpose: Overwrites the quantity for a cart line without stock validation (caller must validate). */
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(i =>
          i.product._id === productId ? { ...i, quantity } : i
        )
      })),
      
      /** Purpose: Refreshes the cached product snapshot in the cart (e.g. after a live-stock check). */
      updateProduct: (productId, freshProduct) => set((state) => ({
        items: state.items.map(i =>
          i.product._id === productId ? { ...i, product: freshProduct } : i
        )
      })),

      /** Purpose: Empties the cart (called after a successful order). */
      clearCart: () => set({ items: [] }),
      
      /** Purpose: Computes the cart grand total from current prices × quantities. */
      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
      },
      
      /** Purpose: Returns the total number of individual units across all cart lines. */
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }),
    { name: 'cart-storage' }
  )
);