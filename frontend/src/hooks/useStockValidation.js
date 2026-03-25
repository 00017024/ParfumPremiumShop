import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

/**
 * @param {Array}  items      - Cart items from cartStore.
 * @param {Function} updateQuantity - cartStore.updateQuantity, used to auto-clamp.
 * @param {Function} removeItem    - cartStore.removeItem, used when product is gone.
 * @returns {{ stockIssues, checking, revalidate }}
 */
export function useStockValidation(items, updateQuantity, removeItem) {
  const [stockIssues, setStockIssues] = useState({});
  const [checking, setChecking]       = useState(false);

  const validate = useCallback(async () => {
    if (items.length === 0) {
      setStockIssues({});
      return;
    }

    setChecking(true);

    try {
      // Fetch all cart products in one parallel batch
      const results = await Promise.allSettled(
        items.map((item) => api.get(`/products/${item.product._id}`))
      );

      const issues = {};

      results.forEach((result, index) => {
        const item = items[index];
        const productId = item.product._id;

        if (result.status === 'rejected') {
          // Product fetch failed — treat as unavailable
          issues[productId] = `${item.product.name} is no longer available.`;
          removeItem(productId);
          return;
        }

        const liveProduct = result.value.data;
        const liveStock   = liveProduct.stock ?? 0;

        if (liveStock === 0) {
          issues[productId] = `${item.product.name} is out of stock.`;
        } else if (item.quantity > liveStock) {
          // Auto-clamp to available stock and inform the user
          issues[productId] =
            `Only ${liveStock} unit${liveStock === 1 ? '' : 's'} available ` +
            `(your cart had ${item.quantity}). Quantity updated.`;
          updateQuantity(productId, liveStock);
        }
      });

      setStockIssues(issues);
    } catch {
      // Network error — don't block checkout, let the backend be the final guard
      setStockIssues({});
    } finally {
      setChecking(false);
    }
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    validate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Run once on mount. Use revalidate() for manual re-checks.

  return { stockIssues, checking, revalidate: validate };
}