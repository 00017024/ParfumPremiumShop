import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import i18n from '@/i18n';

/**
 * Purpose: Validates live stock for all cart items on mount and whenever item IDs/quantities change.
 * Input: items – cart line array; updateQuantity/removeItem/updateProduct – stable cart store actions
 * Output: { stockIssues, checking, revalidate } — stockIssues maps productId → user-facing message.
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

  // Keep items in a ref so validate() can read the current list without
  // being recreated every time product data refreshes (which would cause
  // an infinite loop: updateProduct → new items ref → validate recreated →
  // useEffect fires → validate() → updateProduct → …).
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const validate = useCallback(async () => {
    const currentItems = itemsRef.current;

    if (currentItems.length === 0) {
      setStockIssues({});
      return;
    }

    setChecking(true);

    try {
      // Fetch all cart products in one parallel batch
      const results = await Promise.allSettled(
        currentItems.map((item) => api.get(`/products/${item.product._id}`))
      );

      const issues = {};

      results.forEach((result, index) => {
        const item      = currentItems[index];
        const productId = item.product._id;

        if (result.status === 'rejected') {
          // Product fetch failed (e.g. 404 after a DB reseed) — remove from cart
          issues[productId] = i18n.t('stock.unavailable', { name: item.product.name });
          removeItemRef.current(productId);
          return;
        }

        const liveProduct = result.value.data;
        const liveStock   = liveProduct.stock ?? 0;

        // Refresh the cached product data (price, stock, etc.) without
        // triggering re-validation — the itemsKey below ignores data changes.
        updateProductRef.current(productId, liveProduct);

        if (liveStock === 0) {
          issues[productId] = i18n.t('stock.out_of_stock', { name: item.product.name });
        } else if (item.quantity > liveStock) {
          issues[productId] = i18n.t('stock.quantity_updated', { count: liveStock, qty: item.quantity });
          updateQuantityRef.current(productId, liveStock);
        }
      });

      setStockIssues(issues);
    } catch {
      // Network error — don't block checkout; backend is the final guard
      setStockIssues({});
    } finally {
      setChecking(false);
    }
  }, []); // stable — reads items via ref, cart mutations via refs

  // Derive a key that changes only when cart composition changes
  // (product IDs or quantities), NOT when product data is refreshed.
  // This prevents the infinite loop: updateProduct creates a new items
  // array reference but leaves IDs and quantities unchanged, so itemsKey
  // stays the same and validate() is not re-triggered.
  const itemsKey = items.map((i) => `${i.product._id}:${i.quantity}`).join(',');

  useEffect(() => {
    validate();
  }, [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { stockIssues, checking, revalidate: validate };
}
