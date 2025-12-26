/**
 * Confirm Close Dialog Component
 * 
 * PHASE 6: Extract Confirm Close Dialog
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export interface QuickEditConfirmCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const QuickEditConfirmCloseDialog = React.memo<QuickEditConfirmCloseDialogProps>(({
  open,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Xác nhận đóng
          </DialogTitle>
          <DialogDescription>
            Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng dialog?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onConfirm}>Thoát</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

QuickEditConfirmCloseDialog.displayName = 'QuickEditConfirmCloseDialog';

