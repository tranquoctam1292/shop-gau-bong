/**
 * ClassicEditor Timeout Management Hook
 * 
 * Manages setTimeout cleanup and prevents memory leaks
 */

import { useEffect, useRef } from 'react';

/**
 * Hook to manage setTimeout cleanup and prevent memory leaks
 * Returns timeout manager functions
 */
export function useClassicEditorTimeout() {
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear all pending timeouts
      timeoutRefs.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, []);

  const setTimeoutSafe = (callback: () => void, delay: number = 0): NodeJS.Timeout | null => {
    const timeoutId = setTimeout(() => {
      timeoutRefs.current.delete(timeoutId);
      if (isMountedRef.current) {
        callback();
      }
    }, delay);
    timeoutRefs.current.add(timeoutId);
    return timeoutId;
  };

  const clearTimeoutSafe = (timeoutId: NodeJS.Timeout | null) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(timeoutId);
    }
  };

  return {
    setTimeoutSafe,
    clearTimeoutSafe,
    isMounted: () => isMountedRef.current,
  };
}

