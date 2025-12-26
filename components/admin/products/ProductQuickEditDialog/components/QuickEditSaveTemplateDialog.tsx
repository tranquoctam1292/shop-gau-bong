/**
 * Save Template Dialog Component
 * 
 * PHASE 6: Extract Save Template Dialog
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface QuickEditSaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  templateDescription: string;
  templateCategory: string;
  onTemplateNameChange: (value: string) => void;
  onTemplateDescriptionChange: (value: string) => void;
  onTemplateCategoryChange: (value: string) => void;
  onSave: () => void;
}

export const QuickEditSaveTemplateDialog = React.memo<QuickEditSaveTemplateDialogProps>(({
  open,
  onOpenChange,
  templateName,
  templateDescription,
  templateCategory,
  onTemplateNameChange,
  onTemplateDescriptionChange,
  onTemplateCategoryChange,
  onSave,
}) => {
  const handleClose = () => {
    onOpenChange(false);
    onTemplateNameChange('');
    onTemplateDescriptionChange('');
    onTemplateCategoryChange('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lưu template</DialogTitle>
          <DialogDescription>
            Lưu các giá trị form hiện tại làm template để sử dụng sau
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name" className="text-slate-900">Tên template *</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => onTemplateNameChange(e.target.value)}
              placeholder="Ví dụ: Gấu bông cơ bản"
              className="border-slate-200 focus:ring-2 focus:ring-slate-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description" className="text-slate-900">Mô tả</Label>
            <Textarea
              id="template-description"
              value={templateDescription}
              onChange={(e) => onTemplateDescriptionChange(e.target.value)}
              rows={2}
              placeholder="Mô tả template..."
              className="border-slate-200 focus:ring-2 focus:ring-slate-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-category" className="text-slate-900">Danh mục</Label>
            <Input
              id="template-category"
              value={templateCategory}
              onChange={(e) => onTemplateCategoryChange(e.target.value)}
              placeholder="Ví dụ: Gấu bông, Đồ chơi"
              className="border-slate-200 focus:ring-2 focus:ring-slate-950"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={onSave} disabled={!templateName.trim()}>
            Lưu template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

QuickEditSaveTemplateDialog.displayName = 'QuickEditSaveTemplateDialog';

