/**
 * Template Management Hook
 * 
 * PHASE 6: Extract Template Handlers
 * 
 * Handles template CRUD operations (fetch, save, load, delete)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { QuickEditFormData } from '../types';

export interface UseQuickEditTemplatesOptions {
  isBulkMode: boolean;
  showLoadTemplateDialog: boolean;
  getFormStateSnapshot: () => QuickEditFormData;
  setExternalSnapshot: (snapshot: QuickEditFormData | null) => void;
  reset: (data: QuickEditFormData, options?: { keepDefaultValues?: boolean }) => void;
  resetHistory: (data: QuickEditFormData) => void;
  prevFormStateRef: React.MutableRefObject<QuickEditFormData | null>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export interface UseQuickEditTemplatesResult {
  templates: Array<{ _id: string; name: string; description?: string; category?: string; templateData: unknown; createdAt: string }>;
  loadingTemplates: boolean;
  templateName: string;
  setTemplateName: (name: string) => void;
  templateDescription: string;
  setTemplateDescription: (description: string) => void;
  templateCategory: string;
  setTemplateCategory: (category: string) => void;
  templateSearchQuery: string;
  setTemplateSearchQuery: (query: string) => void;
  fetchTemplates: () => Promise<void>;
  handleSaveTemplate: () => Promise<void>;
  handleLoadTemplate: (templateId: string) => Promise<void>;
  handleDeleteTemplate: (templateId: string) => Promise<void>;
}

export function useQuickEditTemplates({
  isBulkMode,
  showLoadTemplateDialog,
  getFormStateSnapshot,
  setExternalSnapshot,
  reset,
  resetHistory,
  showToast,
}: UseQuickEditTemplatesOptions): UseQuickEditTemplatesResult {
  const [templates, setTemplates] = useState<Array<{ _id: string; name: string; description?: string; category?: string; templateData: unknown; createdAt: string }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  // PHASE 4: Quick Edit Templates (4.3.8) - Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch('/api/admin/products/templates', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error: unknown) {
      console.error('Error fetching templates:', error);
      showToast('Không thể tải danh sách template', 'error');
    } finally {
      setLoadingTemplates(false);
    }
  }, [showToast]);

  // PHASE 4: Quick Edit Templates (4.3.8) - Load templates only when user opens "Load template" dialog
  // PERFORMANCE: Don't fetch templates on dialog open, fetch only when user clicks "Load template" button
  useEffect(() => {
    if (showLoadTemplateDialog && !isBulkMode) {
      fetchTemplates(); // Only fetch when user opens the load template dialog
    }
  }, [showLoadTemplateDialog, isBulkMode, fetchTemplates]);

  // PHASE 4: Quick Edit Templates (4.3.8) - Save template handler
  const handleSaveTemplate = useCallback(async () => {
    if (!templateName.trim()) {
      showToast('Vui lòng nhập tên template', 'error');
      return;
    }

    try {
      // PHASE 1: CSRF Protection (7.12.2) - Include CSRF token in headers
      const { getCsrfTokenHeader } = await import('@/lib/utils/csrfClient');
      const csrfToken = await getCsrfTokenHeader();
      
      const currentFormData = getFormStateSnapshot();
      const response = await fetch('/api/admin/products/templates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken, // PHASE 1: CSRF Protection (7.12.2)
        },
        credentials: 'include',
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim() || undefined,
          category: templateCategory.trim() || undefined,
          templateData: currentFormData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Failed to save template');
      }

      showToast('Đã lưu template thành công', 'success');
      setTemplateName('');
      setTemplateDescription('');
      setTemplateCategory('');
      fetchTemplates();
    } catch (error: unknown) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu template';
      showToast(errorMessage, 'error');
    }
  }, [templateName, templateDescription, templateCategory, getFormStateSnapshot, showToast, fetchTemplates]);

  // PHASE 4: Quick Edit Templates (4.3.8) - Load template handler
  const handleLoadTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/products/templates/${templateId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load template');
      }

      const data = await response.json();
      if (data.template && data.template.templateData) {
        const templateData = data.template.templateData as QuickEditFormData;
        // Apply template data to form
        // PHASE 3.1: Use externalSnapshot to update snapshot in hook
        setExternalSnapshot(templateData);
        reset(templateData, { keepDefaultValues: false });
        // Reset history after loading template
        resetHistory(templateData);
        // Note: prevFormStateRef is now managed by useQuickEditUndoRedo hook
        showToast('Đã tải template thành công', 'success');
        // Note: setShowLoadTemplateDialog(false) should be called by parent component
      } else {
        showToast('Template không hợp lệ', 'error');
      }
    } catch (error: unknown) {
      console.error('Error loading template:', error);
      showToast('Có lỗi xảy ra khi tải template', 'error');
    }
  }, [reset, resetHistory, setExternalSnapshot, showToast]);

  // PHASE 4: Quick Edit Templates (4.3.8) - Delete template handler
  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa template này?')) {
      return;
    }

    try {
      // PHASE 1: CSRF Protection (7.12.2) - Include CSRF token in headers
      const { getCsrfTokenHeader } = await import('@/lib/utils/csrfClient');
      const csrfToken = await getCsrfTokenHeader();
      
      const response = await fetch(`/api/admin/products/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken, // PHASE 1: CSRF Protection (7.12.2)
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Failed to delete template');
      }

      showToast('Đã xóa template thành công', 'success');
      fetchTemplates();
    } catch (error: unknown) {
      console.error('Error deleting template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa template';
      showToast(errorMessage, 'error');
    }
  }, [showToast, fetchTemplates]);

  return {
    templates,
    loadingTemplates,
    templateName,
    setTemplateName,
    templateDescription,
    setTemplateDescription,
    templateCategory,
    setTemplateCategory,
    templateSearchQuery,
    setTemplateSearchQuery,
    fetchTemplates,
    handleSaveTemplate,
    handleLoadTemplate,
    handleDeleteTemplate,
  };
}

