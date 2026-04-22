import { useState, useEffect } from 'react';

/**
 * Purpose: Returns a debounced copy of value that only updates after the given delay has elapsed with no new changes.
 * Input: value – any value to debounce, delay – milliseconds
 * Output: The last stable value after the delay window.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}