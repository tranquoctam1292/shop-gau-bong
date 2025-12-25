import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * PHASE 4: Undo/Redo Memory Optimization (7.4.2) - Shallow copy utility
 * Creates a shallow copy of an object/array to avoid deep cloning overhead
 */
function shallowCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return [...obj] as T;
  }

  return { ...obj } as T;
}

/**
 * Custom hook for undo/redo functionality
 * @template T - Type of state to track
 * @param initialState - Initial state value
 * @param maxHistory - Maximum number of history entries (default: 50)
 * @param onStateChange - Optional callback when state changes
 * @param useShallowCopy - Whether to use shallow copy instead of deep copy (default: true for memory optimization)
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistory: number = 50,
  onStateChange?: (state: T) => void,
  useShallowCopy: boolean = true
) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoRef = useRef(false); // Flag to prevent adding to history during undo/redo

  // Get current state
  const currentState = history[currentIndex];

  // Add new state to history
  const addToHistory = useCallback(
    (newState: T) => {
      // Don't add to history if we're in the middle of undo/redo
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        return;
      }

      setHistory((prevHistory) => {
        // Remove any states after current index (can't redo after new change)
        const newHistory = prevHistory.slice(0, currentIndex + 1);
        
        // PHASE 4: Memory Optimization (7.4.2) - Use shallow copy to save memory
        const stateToStore = useShallowCopy ? shallowCopy(newState) : newState;
        newHistory.push(stateToStore);
        
        // Limit history size
        if (newHistory.length > maxHistory) {
          newHistory.shift(); // Remove oldest entry
          return newHistory;
        }
        
        return newHistory;
      });

      setCurrentIndex((prevIndex) => {
        const newIndex = Math.min(prevIndex + 1, maxHistory - 1);
        return newIndex;
      });

      // CRITICAL FIX: Do NOT call onStateChange here - it should only be called during undo/redo
      // Calling it here would trigger form reset when user makes changes, causing infinite loop
    },
    [currentIndex, maxHistory, useShallowCopy]
  );

  // Undo: Go back to previous state
  const undo = useCallback(() => {
    if (canUndo()) {
      isUndoRedoRef.current = true;
      setCurrentIndex((prevIndex) => {
        const newIndex = prevIndex - 1;
        const newState = history[newIndex];
        if (onStateChange && newState !== undefined) {
          onStateChange(newState);
        }
        return newIndex;
      });
    }
  }, [history, onStateChange]);

  // Redo: Go forward to next state
  const redo = useCallback(() => {
    if (canRedo()) {
      isUndoRedoRef.current = true;
      setCurrentIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        const newState = history[newIndex];
        if (onStateChange && newState !== undefined) {
          onStateChange(newState);
        }
        return newIndex;
      });
    }
  }, [history, onStateChange]);

  // Check if undo is possible
  const canUndo = useCallback(() => {
    return currentIndex > 0;
  }, [currentIndex]);

  // Check if redo is possible
  const canRedo = useCallback(() => {
    return currentIndex < history.length - 1;
  }, [currentIndex, history.length]);

  // Reset history (e.g., after save)
  const resetHistory = useCallback(
    (newState: T) => {
      // PHASE 4: Memory Optimization (7.4.2) - Use shallow copy to save memory
      const stateToStore = useShallowCopy ? shallowCopy(newState) : newState;
      setHistory([stateToStore]);
      setCurrentIndex(0);
      isUndoRedoRef.current = false;
      if (onStateChange) {
        onStateChange(newState);
      }
    },
    [onStateChange, useShallowCopy]
  );

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
    isUndoRedoRef.current = false;
  }, [initialState]);

  return {
    currentState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    clearHistory,
    historyLength: history.length,
    currentIndex,
  };
}

