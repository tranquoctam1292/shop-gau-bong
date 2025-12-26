/**
 * Status Change Warning Dialog Component
 * 
 * PHASE 6: Extract Status Change Warning Dialog
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export interface QuickEditStatusChangeWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingStatus: 'draft' | 'publish' | 'trash' | null;
  previousStatus: 'draft' | 'publish' | 'trash' | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const QuickEditStatusChangeWarningDialog = React.memo<QuickEditStatusChangeWarningDialogProps>(({
  open,
  onOpenChange,
  pendingStatus,
  previousStatus,
  onConfirm,
  onCancel,
}) => {
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Bản nháp',
      publish: 'Đã xuất bản',
      trash: 'Đã xóa',
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Xác nhận thay đổi trạng thái
          </DialogTitle>
          <DialogDescription className="pt-2">
            Bạn đang thay đổi trạng thái sản phẩm từ <strong>&quot;{getStatusLabel(previousStatus || '')}&quot;</strong> sang <strong>&quot;{getStatusLabel(pendingStatus || '')}&quot;</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-700 mb-2">
            Sản phẩm sẽ không hiển thị trên website sau khi thay đổi. Bạn có chắc chắn muốn tiếp tục?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
            <p className="text-xs text-amber-800">
              <strong>Lưu ý:</strong> Bạn có thể thay đổi lại trạng thái thành &quot;Đã xuất bản&quot; bất cứ lúc nào.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button variant="default" onClick={onConfirm}>
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

QuickEditStatusChangeWarningDialog.displayName = 'QuickEditStatusChangeWarningDialog';

