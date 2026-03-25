import { useState, useEffect } from 'react';

/**
 * Delay updating the returned value until the input value has stopped
 * changing for the specified duration.
 *
 * @param {*}      value 
 * @param {number} delay 
 * @returns
 *
 * @example
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}