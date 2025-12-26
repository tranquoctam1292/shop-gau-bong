/**
 * Product Type Warning Dialog Component
 * 
 * PHASE 6: Extract Product Type Warning Dialog
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export interface QuickEditProductTypeWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingProductType: 'simple' | 'variable' | 'grouped' | 'external' | null;
  variantCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const QuickEditProductTypeWarningDialog = React.memo<QuickEditProductTypeWarningDialogProps>(({
  open,
  onOpenChange,
  pendingProductType,
  variantCount,
  onConfirm,
  onCancel,
}) => {
  const getProductTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      simple: 'Đơn giản',
      variable: 'Có biến thể',
      grouped: 'Nhóm sản phẩm',
      external: 'Sản phẩm ngoài',
    };
    return labels[type] || 'Loại khác';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Cảnh báo: Thay đổi loại sản phẩm
          </DialogTitle>
          <DialogDescription className="pt-2">
            Sản phẩm này đang có <strong>{variantCount} biến thể</strong>. 
            Việc thay đổi loại sản phẩm từ <strong>&quot;Có biến thể&quot;</strong> sang <strong>&quot;{getProductTypeLabel(pendingProductType || '')}&quot;</strong> sẽ khiến tất cả các biến thể bị xóa và không thể khôi phục.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-700 mb-2">
            Bạn có chắc chắn muốn tiếp tục?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
            <p className="text-xs text-amber-800">
              <strong>Lưu ý:</strong> Để thay đổi loại sản phẩm an toàn, vui lòng xóa hoặc quản lý các biến thể trước trong form chỉnh sửa đầy đủ.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Xác nhận thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

QuickEditProductTypeWarningDialog.displayName = 'QuickEditProductTypeWarningDialog';

