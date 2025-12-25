/**
 * Mobile Keyboard Handling Hook
 * 
 * PHASE 2: Mobile Keyboard Issues (7.9.2)
 * 
 * Handles mobile keyboard detection và auto-scroll for inputs
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface UseMobileKeyboardOptions {
  enabled?: boolean; // Whether to enable keyboard handling
  scrollOffset?: number; // Offset from top when scrolling input into view
}

export function useMobileKeyboard({
  enabled = true,
  scrollOffset = 100, // Default 100px from top
}: UseMobileKeyboardOptions = {}) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialViewportHeight = useRef<number>(0);

  // Detect keyboard open/close by monitoring viewport height changes
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      
      if (initialViewportHeight.current === 0) {
        initialViewportHeight.current = currentHeight;
        return;
      }

      // Keyboard is considered open if viewport height decreased significantly (>150px)
      const heightDiff = initialViewportHeight.current - currentHeight;
      setIsKeyboardOpen(heightDiff > 150);
    };

    // Use visualViewport API if available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [enabled]);

  // Auto-scroll input into view when focused
  const scrollInputIntoView = (inputElement: HTMLElement) => {
    if (!enabled || !containerRef.current) return;

    try {
      const container = containerRef.current;
      const inputRect = inputElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate scroll position to bring input into view
      const scrollTop = container.scrollTop;
      const inputTopRelativeToContainer = inputRect.top - containerRect.top + scrollTop;
      const targetScrollTop = inputTopRelativeToContainer - scrollOffset;

      // Smooth scroll to input position
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    } catch (error) {
      console.error('[useMobileKeyboard] Error scrolling input into view:', error);
    }
  };

  // Handle input focus events
  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!enabled) return;
    
    // Small delay to ensure keyboard is opening
    setTimeout(() => {
      scrollInputIntoView(event.target);
    }, 300); // 300ms delay to wait for keyboard animation
  };

  return {
    isKeyboardOpen,
    containerRef,
    handleInputFocus,
    scrollInputIntoView,
  };
}

