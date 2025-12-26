/**
 * Keyboard Shortcuts Hook
 * 
 * PHASE 6: Extract Keyboard Shortcuts Handler
 * 
 * Handles keyboard shortcuts for quick edit dialog
 */

'use client';

import { useEffect } from 'react';

export interface UseQuickEditKeyboardShortcutsOptions {
  open: boolean;
  activeTab: string;
  formIsDirty: boolean;
  isLoading: boolean;
  onSave: () => void;
  onShowShortcutsHelp: () => void;
  onClose: () => void;
  setShowConfirmClose: (show: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function useQuickEditKeyboardShortcuts({
  open,
  activeTab,
  formIsDirty,
  isLoading,
  onSave,
  onShowShortcutsHelp,
  onClose,
  setShowConfirmClose,
  showToast,
}: UseQuickEditKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!open || activeTab !== 'edit') return; // Only handle shortcuts when edit tab is active

    const handleKeyDown = (e: KeyboardEvent) => {
      // PHASE 4: Browser detection for proper shortcut handling
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
      const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
      const shouldHandleShortcut = ctrlKey && (isMac || isWindows || isLinux);

      // Ctrl/Cmd + S: Save changes
      if (shouldHandleShortcut && e.key === 's' && !e.shiftKey && !e.altKey) {
        // PHASE 4: Prevent default browser behavior (save page) and stop propagation
        e.preventDefault();
        e.stopPropagation();
        if (formIsDirty && !isLoading) {
          const form = document.getElementById('quick-edit-form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }
        return;
      }

      // Ctrl/Cmd + 1-7: Jump to sections
      if (shouldHandleShortcut && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        e.stopPropagation();
        const sectionIndex = parseInt(e.key, 10) - 1;
        const sectionIds = [
          'section-basic-info',
          'section-pricing',
          'section-product-type',
          'section-shipping',
          'section-dimensions',
          'section-categories',
          'section-images',
        ];
        const targetSectionId = sectionIds[sectionIndex];
        if (targetSectionId) {
          const targetElement = document.getElementById(targetSectionId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const sectionName = targetElement.querySelector('h3')?.textContent || targetSectionId;
            showToast(`Chuyển đến mục: ${sectionName}`, 'info');
          }
        }
        return;
      }

      // Esc: Close dialog (with confirm if dirty)
      if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        // Check if focus is in an input/textarea (native Escape behavior should work there)
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );
        
        if (isInputFocused) {
          // Let native Escape behavior work (e.g., clear input, close dropdown)
          return;
        }
        
        // PHASE 4: Prevent default browser behavior and stop propagation when closing dialog
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        if (formIsDirty) {
          setShowConfirmClose(true);
        } else {
          onClose();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase to catch events early
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, activeTab, formIsDirty, isLoading, onSave, onShowShortcutsHelp, onClose, setShowConfirmClose, showToast]);
}

