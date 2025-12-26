/**
 * Comparison Dialog Component
 * 
 * PHASE 6: Extract Comparison Dialog
 * 
 * Wrapper dialog for QuickEditComparisonTab component
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GitCompare } from 'lucide-react';
import { QuickEditComparisonTab } from './QuickEditComparisonTab';
import type { QuickEditFormData } from '../types';

export interface QuickEditComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshotInitialData: QuickEditFormData | null;
  productId?: string;
  productName?: string;
}

export const QuickEditComparisonDialog = React.memo<QuickEditComparisonDialogProps>(({
  open,
  onOpenChange,
  snapshotInitialData,
  productId,
  productName,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            So sánh thay đổi
          </DialogTitle>
          <DialogDescription>
            Xem các thay đổi trước khi lưu
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4">
          <QuickEditComparisonTab
            snapshotInitialData={snapshotInitialData}
            productId={productId}
            productName={productName}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

QuickEditComparisonDialog.displayName = 'QuickEditComparisonDialog';

