import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

/**
 * @param {Array}  items      - Cart items from cartStore.
 * @param {Function} updateQuantity - cartStore.updateQuantity, used to auto-clamp.
 * @param {Function} removeItem    - cartStore.removeItem, used when product is gone.
 * @returns {{ stockIssues, checking, revalidate }}
 */
export function useStockValidation(items, updateQuantity, removeItem, updateProduct) {
  const [stockIssues, setStockIssues] = useState({});
  const [checking, setChecking]       = useState(false);

  // Stable refs so the callback never goes stale on store function identity changes
  const updateQuantityRef = useRef(updateQuantity);
  const removeItemRef     = useRef(removeItem);
  const updateProductRef  = useRef(updateProduct);
  useEffect(() => { updateQuantityRef.current = updateQuantity; }, [updateQuantity]);
  useEffect(() => { removeItemRef.current     = removeItem;     }, [removeItem]);
  useEffect(() => { updateProductRef.current  = updateProduct;  }, [updateProduct]);

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
          removeItemRef.current(productId);
          return;
        }

        const liveProduct = result.value.data;
        const liveStock   = liveProduct.stock ?? 0;

        // Refresh the cached product data (price, stock, etc.)
        updateProductRef.current(productId, liveProduct);

        if (liveStock === 0) {
          issues[productId] = `${item.product.name} is out of stock.`;
        } else if (item.quantity > liveStock) {
          issues[productId] =
            `Only ${liveStock} unit${liveStock === 1 ? '' : 's'} available ` +
            `(your cart had ${item.quantity}). Quantity updated.`;
          updateQuantityRef.current(productId, liveStock);
        }
      });

      setStockIssues(issues);
    } catch {
      // Network error — don't block checkout, let the backend be the final guard
      setStockIssues({});
    } finally {
      setChecking(false);
    }
  }, [items]); // re-creates when items array reference changes

  useEffect(() => {
    validate();
  }, [validate]); // runs on mount and whenever items change

  return { stockIssues, checking, revalidate: validate };
}
