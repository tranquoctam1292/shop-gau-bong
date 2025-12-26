/**
 * ClassicEditor Sticky Toolbar Hook
 * 
 * Handles sticky toolbar behavior on scroll
 */

import { useEffect, useRef } from 'react';

interface UseClassicEditorStickyOptions {
  toolbarRef: React.RefObject<HTMLDivElement>;
  editorContainerRef: React.RefObject<HTMLDivElement>;
  setIsToolbarSticky: (sticky: boolean) => void;
}

export function useClassicEditorSticky({
  toolbarRef,
  editorContainerRef,
  setIsToolbarSticky,
}: UseClassicEditorStickyOptions): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const setupScrollListener = () => {
      if (!toolbarRef.current || !editorContainerRef.current) {
        // Retry after a short delay
        timeoutRef.current = setTimeout(setupScrollListener, 100);
        return;
      }

      const handleScroll = () => {
        const toolbar = toolbarRef.current;
        const container = editorContainerRef.current;
        if (!toolbar || !container) return;

        const toolbarRect = toolbar.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Admin bar height (32px as per spec)
        const adminBarHeight = 32;
        
        // Check if toolbar is scrolled out of view (above viewport)
        const isToolbarOutOfView = toolbarRect.top < adminBarHeight;
        
        // Check if we're still within the editor container
        // Toolbar should hide when we scroll past the container bottom or before container top
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;
        const isWithinContainer = containerTop < window.innerHeight && containerBottom > adminBarHeight;
        
        // Show sticky toolbar when:
        // 1. Original toolbar is scrolled out of view (above viewport)
        // 2. We're still within the editor container
        // 3. We've scrolled down (not at the top)
        // Check if component is still mounted before calling setState
        if (isMountedRef.current) {
          if (isToolbarOutOfView && isWithinContainer && scrollY > 0) {
            setIsToolbarSticky(true);
          } else {
            setIsToolbarSticky(false);
          }
        }
      };

      // Listen to scroll events on window
      window.addEventListener('scroll', handleScroll, { passive: true });
      // Also check on initial load and resize
      handleScroll();
      window.addEventListener('resize', handleScroll, { passive: true });

      // Store cleanup function
      cleanupRef.current = () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    };

    // Start checking for refs
    setupScrollListener();

    // Return cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [toolbarRef, editorContainerRef, setIsToolbarSticky]);
}

