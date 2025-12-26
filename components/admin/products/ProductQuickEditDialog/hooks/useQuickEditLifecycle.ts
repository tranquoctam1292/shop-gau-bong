'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { QuickEditFormData } from '../types';

/**
 * Hook for Quick Edit Dialog Lifecycle Management
 * 
 * PHASE 3.4: Extract Lifecycle Handlers
 * 
 * Handles:
 * - Dialog open/close state management
 * - Close confirmation dialog
 * - Before unload warning (browser navigation)
 * - Navigation guard (internal link clicks)
 * 
 * @param options - Configuration options for lifecycle management
 * @returns Lifecycle handlers and state
 */

interface UseQuickEditLifecycleOptions {
  // Dialog state
  open: boolean;
  isDirty: boolean;
  isLoading: boolean;
  
  // Form methods
  reset: (values?: QuickEditFormData) => void;
  initialData: QuickEditFormData;
  
  // Callbacks
  onClose: () => void;
}

export function useQuickEditLifecycle({
  open,
  isDirty,
  isLoading,
  reset,
  initialData,
  onClose,
}: UseQuickEditLifecycleOptions) {
  
  // Dialog close confirmation state
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  
  // FIX: Track if save was just completed to prevent auto-close
  // After save, isDirty becomes false, but we don't want to auto-close
  const justSavedRef = useRef<boolean>(false);
  
  // PHASE 4: Unsaved Changes Warning (7.11.10) - Track isDirty in ref for beforeunload
  const isDirtyRef = useRef<boolean>(false);
  
  // PHASE 4: Unsaved Changes Warning (7.11.10) - Update isDirty ref for beforeunload (after isDirty is defined)
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);
  
  // PHASE 4: Unsaved Changes Warning (7.11.10) - beforeunload event handler
  useEffect(() => {
    if (!open) return; // Only handle when dialog is open

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        // Standard way to show browser warning
        e.preventDefault();
        // Modern browsers ignore custom message, but we set it anyway
        e.returnValue = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [open]);
  
  // PHASE 4: Unsaved Changes Warning (7.11.10) - Navigation guard for Next.js App Router
  useEffect(() => {
    if (!open || !isDirty) return;

    // Intercept link clicks within the dialog
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        // Check if it's an internal link (same origin)
        try {
          const linkUrl = new URL(link.href);
          const currentUrl = new URL(window.location.href);
          
          // Only intercept internal navigation
          if (linkUrl.origin === currentUrl.origin && linkUrl.pathname !== currentUrl.pathname) {
            e.preventDefault();
            e.stopPropagation();
            
            // Show confirmation dialog
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang này?')) {
              // User confirmed, allow navigation
              window.location.href = link.href;
            }
          }
        } catch (error) {
          // Invalid URL, ignore
        }
      }
    };

    // Add click listener to document when dialog is open and form is dirty
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [open, isDirty]);
  
  // Handle close from onOpenChange (backdrop click, ESC key)
  const handleOpenChange = useCallback((isOpen: boolean) => {
    // Prevent auto-close when dialog is being opened or when submitting
    if (isOpen === true || isLoading) {
      return;
    }
    
    // FIX: Prevent auto-close immediately after save
    // After save, isDirty becomes false, but we don't want to auto-close
    // User must explicitly close the dialog by clicking close button
    if (justSavedRef.current) {
      // Don't auto-close immediately after save
      // Prevent Radix UI from closing by not calling onClose
      // Return early to prevent any close action
      // CRITICAL: Don't call onClose() - this prevents dialog from closing
      return;
    }
    
    // Only show confirm dialog if there are actual unsaved changes
    if (isOpen === false) {
      if (isDirty) {
        // Form has unsaved changes - show confirm dialog
        setShowConfirmClose(true);
      } else {
        // No changes - close immediately without confirmation
        onClose();
      }
    }
  }, [isDirty, isLoading, onClose]);
  
  // Handle close from button click
  const handleCloseClick = useCallback(() => {
    // Prevent close when submitting
    if (isLoading) {
      return;
    }
    
    // FIX: Prevent auto-close immediately after save
    // After save, isDirty becomes false, but we don't want to auto-close
    if (justSavedRef.current) {
      // Don't auto-close immediately after save
      // User must explicitly close the dialog again
      return;
    }
    
    // Only show confirm dialog if there are actual unsaved changes
    if (isDirty) {
      // Form has unsaved changes - show confirm dialog
      setShowConfirmClose(true);
    } else {
      // No changes - close immediately without confirmation
      onClose();
    }
  }, [isDirty, isLoading, onClose]);
  
  // Handle confirm close (user confirmed they want to discard changes)
  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false);
    reset(initialData);
    onClose();
  }, [reset, initialData, onClose]);
  
  // Reset confirm dialog state when opening
  useEffect(() => {
    if (open) {
      setShowConfirmClose(false);
      justSavedRef.current = false; // Reset justSaved flag when dialog opens
    }
  }, [open]);
  
  // Export function to mark that save was just completed
  // This will be called from parent component after successful save
  const markJustSaved = useCallback(() => {
    justSavedRef.current = true;
    // Reset flag after 10 seconds to allow normal close behavior
    // This prevents auto-close immediately after save, but allows normal close after a delay
    // Increased to 10 seconds to give user enough time to see success feedback and continue editing
    // After 10 seconds, user can close dialog normally if they want
    setTimeout(() => {
      justSavedRef.current = false;
    }, 10000);
  }, []);
  
  return {
    showConfirmClose,
    setShowConfirmClose,
    handleOpenChange,
    handleCloseClick,
    handleConfirmClose,
    markJustSaved, // Export function to mark that save was just completed
  };
}

