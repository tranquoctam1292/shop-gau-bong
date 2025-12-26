/**
 * Keyboard Shortcuts Help Dialog Component
 * 
 * PHASE 6: Extract Keyboard Shortcuts Dialog
 * 
 * Displays keyboard shortcuts help in a modal dialog (desktop) or sheet (mobile)
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

export interface QuickEditKeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
}

export const QuickEditKeyboardShortcutsDialog = React.memo<QuickEditKeyboardShortcutsDialogProps>(({
  open,
  onOpenChange,
  isMobile,
}) => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  const shortcutsContent = (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Thao tác chính</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Lưu thay đổi</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
              {modifierKey} + S
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Đóng dialog</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
              Esc
            </kbd>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Điều hướng</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Thông tin cơ bản</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
              {modifierKey} + 1
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Giá & Trạng thái</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
              {modifierKey} + 2
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Loại sản phẩm</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
              {modifierKey} + 3
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Giao hàng & Thuế</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
              {modifierKey} + 4
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Kích thước & Trọng lượng</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
              {modifierKey} + 5
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Danh mục</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
              {modifierKey} + 6
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700">Hình ảnh</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
              {modifierKey} + 7
            </kbd>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Mẹo</h3>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          <li>Sử dụng Tab để di chuyển giữa các trường</li>
          <li>Nhấn Enter để lưu thay đổi</li>
          <li>Nhấn Esc để đóng dialog (có xác nhận nếu có thay đổi chưa lưu)</li>
        </ul>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Phím tắt bàn phím
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {shortcutsContent}
          </div>
          <SheetFooter className="mt-6">
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Đóng
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Phím tắt bàn phím
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {shortcutsContent}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

QuickEditKeyboardShortcutsDialog.displayName = 'QuickEditKeyboardShortcutsDialog';

