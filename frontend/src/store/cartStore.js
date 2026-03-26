import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
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
      
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.product._id !== productId)
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(i =>
          i.product._id === productId ? { ...i, quantity } : i
        )
      })),
      
      updateProduct: (productId, freshProduct) => set((state) => ({
        items: state.items.map(i =>
          i.product._id === productId ? { ...i, product: freshProduct } : i
        )
      })),

      clearCart: () => set({ items: [] }),
      
      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
      },
      
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }),
    { name: 'cart-storage' }
  )
);