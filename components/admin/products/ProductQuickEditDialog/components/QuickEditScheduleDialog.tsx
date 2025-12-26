/**
 * Schedule Dialog Component
 * 
 * PHASE 6: Extract Schedule Dialog
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';

export interface QuickEditScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledDateTime: string;
  onDateTimeChange: (value: string) => void;
  onConfirm: () => Promise<void>;
}

export const QuickEditScheduleDialog = React.memo<QuickEditScheduleDialogProps>(({
  open,
  onOpenChange,
  scheduledDateTime,
  onDateTimeChange,
  onConfirm,
}) => {
  const timeUntil = scheduledDateTime ? (() => {
    const scheduledDate = new Date(scheduledDateTime);
    const now = new Date();
    const diffMs = scheduledDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Còn ${diffDays} ngày ${diffHours % 24} giờ`;
    } else if (diffHours > 0) {
      return `Còn ${diffHours} giờ ${diffMins % 60} phút`;
    } else if (diffMins > 0) {
      return `Còn ${diffMins} phút`;
    } else {
      return 'Thời gian đã qua';
    }
  })() : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lên lịch cập nhật
          </DialogTitle>
          <DialogDescription>
            Lên lịch để áp dụng các thay đổi vào thời điểm cụ thể
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-datetime" className="text-slate-900">Ngày và giờ *</Label>
            <Input
              id="schedule-datetime"
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => onDateTimeChange(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="border-slate-200 focus:ring-2 focus:ring-slate-950"
            />
            <p className="text-xs text-slate-500">
              Chọn thời điểm để áp dụng các thay đổi. Thời gian phải trong tương lai.
            </p>
          </div>
          {scheduledDateTime && timeUntil && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Thời gian đã chọn:</strong> {new Date(scheduledDateTime).toLocaleString('vi-VN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
              <p className="text-xs text-blue-700 mt-1">{timeUntil}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onDateTimeChange('');
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!scheduledDateTime}
          >
            Lên lịch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

QuickEditScheduleDialog.displayName = 'QuickEditScheduleDialog';

