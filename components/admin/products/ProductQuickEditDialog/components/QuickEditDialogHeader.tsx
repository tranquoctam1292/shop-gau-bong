'use client';

import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AlertCircle, Keyboard } from 'lucide-react';

export interface QuickEditDialogHeaderProps {
  isMobile: boolean;
  isBulkMode: boolean;
  bulkProductCount?: number;
  productId?: string;
  isDirty: boolean;
  onShowShortcutsHelp: () => void;
}

export const QuickEditDialogHeader = React.memo<QuickEditDialogHeaderProps>(({
  isMobile,
  isBulkMode,
  bulkProductCount,
  productId,
  isDirty,
  onShowShortcutsHelp,
}) => {
  const title = isBulkMode ? `Sửa nhanh ${bulkProductCount} sản phẩm` : 'Sửa nhanh sản phẩm';

  // Mobile: Sheet Header
  if (isMobile) {
    return (
      <SheetHeader className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <SheetTitle className="text-lg font-semibold text-slate-900">
              {title}
            </SheetTitle>
            {!isBulkMode && <p className="text-sm text-slate-500 mt-1">ID: {productId || 'N/A'}</p>}
            {/* PHASE 4: Unsaved Changes Warning (7.11.10) - Visual warning banner */}
            {isDirty && (
              <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">Bạn có thay đổi chưa lưu</p>
              </div>
            )}
          </div>
          {/* UX/UI UPGRADE Phase 4.2.2: Keyboard shortcuts help button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onShowShortcutsHelp}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex-shrink-0"
            aria-label="Xem phím tắt bàn phím"
            title="Xem phím tắt bàn phím (?)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </SheetHeader>
    );
  }

  // Desktop: Dialog Header
  return (
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {title}
          </DialogTitle>
          {!isBulkMode && (
            <DialogDescription className="text-sm text-slate-500 mt-1">
              ID: {productId || 'N/A'}
            </DialogDescription>
          )}
          {/* PHASE 4: Unsaved Changes Warning (7.11.10) - Visual warning banner */}
          {isDirty && (
            <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800">Bạn có thay đổi chưa lưu</p>
            </div>
          )}
        </div>
        {/* UX/UI UPGRADE Phase 4.2.2: Keyboard shortcuts help button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onShowShortcutsHelp}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px]"
          aria-label="Xem phím tắt bàn phím"
          title="Xem phím tắt bàn phím (?)"
        >
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Phím tắt</span>
        </Button>
      </div>
    </DialogHeader>
  );
});

QuickEditDialogHeader.displayName = 'QuickEditDialogHeader';

