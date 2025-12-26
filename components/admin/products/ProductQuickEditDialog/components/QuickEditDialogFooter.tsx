'use client';

import React from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Keyboard, Clock, GitCompare, RotateCcw } from 'lucide-react';

export interface QuickEditDialogFooterProps {
  isMobile: boolean;
  isBulkMode: boolean;
  isDirty: boolean;
  formIsDirty: boolean;
  isLoading: boolean;
  showSuccessIndicator: boolean;
  lastSavedTime: Date | null;
  onClose: () => void;
  onReset: () => void;
  onShowComparison?: () => void;
  onShowSchedule?: () => void;
}

export const QuickEditDialogFooter = React.memo<QuickEditDialogFooterProps>(({
  isMobile,
  isBulkMode,
  isDirty,
  formIsDirty,
  isLoading,
  showSuccessIndicator,
  lastSavedTime,
  onClose,
  onReset,
  onShowComparison,
  onShowSchedule,
}) => {
  const FooterComponent = isMobile ? SheetFooter : DialogFooter;
  const paddingClass = isMobile ? 'px-4 py-3 md:px-6 md:py-4' : 'px-6 py-4';

  return (
    <div className={`sticky bottom-0 z-50 bg-white border-t border-slate-200 ${paddingClass} flex-shrink-0`}>
      <FooterComponent className="px-0 py-0 border-0 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="min-h-[44px] border-slate-200 text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Hủy
        </Button>
        {/* PHASE 4: Product Comparison (4.4.1) - Comparison button */}
        {!isBulkMode && isDirty && onShowComparison && (
          <Button
            type="button"
            variant="outline"
            onClick={onShowComparison}
            disabled={isLoading}
            className="min-h-[44px] border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="So sánh thay đổi"
          >
            <GitCompare className="h-4 w-4" />
            So sánh
          </Button>
        )}
        {/* PHASE 4: Scheduled Updates (4.4.2) - Schedule button */}
        {!isBulkMode && isDirty && onShowSchedule && (
          <Button
            type="button"
            variant="outline"
            onClick={onShowSchedule}
            disabled={isLoading}
            className="min-h-[44px] border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Lên lịch cập nhật"
          >
            <Clock className="h-4 w-4" />
            Lên lịch
          </Button>
        )}
        {/* PHASE 3: Quick Actions & Shortcuts (7.11.15) - Reset form button */}
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={!formIsDirty || isLoading}
          className="min-h-[44px] border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Đặt lại
        </Button>
        <div className="flex flex-col items-end gap-1">
          <Button
            type="submit"
            form="quick-edit-form"
            disabled={!isDirty || isLoading}
            className={`min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              showSuccessIndicator ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : showSuccessIndicator ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span>Đã lưu</span>
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </Button>
          {/* PHASE 2: Button Placement & Hierarchy (7.11.5) - Keyboard hint */}
          {!isLoading && !showSuccessIndicator && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Keyboard className="h-3 w-3" />
              <span>Ctrl+S để lưu</span>
            </div>
          )}
        </div>
      </FooterComponent>
      {/* PHASE 2: Success Feedback Enhancement (7.11.4) - Last saved timestamp */}
      {lastSavedTime && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 w-full justify-center">
          <Clock className="h-3 w-3" />
          <span>Đã lưu lúc: {lastSavedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      )}
    </div>
  );
});

QuickEditDialogFooter.displayName = 'QuickEditDialogFooter';

