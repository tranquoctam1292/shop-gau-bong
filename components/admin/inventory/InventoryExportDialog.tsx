'use client';

/**
 * Inventory Export Dialog
 * Dialog de xuat du lieu ton kho
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';

// ============================================
// Types
// ============================================

type ExportFormat = 'csv' | 'json';

interface InventoryExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// Component
// ============================================

export function InventoryExportDialog({ open, onOpenChange }: InventoryExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/inventory/export?format=${format}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi xuất dữ liệu');
      }

      if (format === 'csv') {
        // Download CSV file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Download JSON file
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Xuất dữ liệu tồn kho
          </DialogTitle>
          <DialogDescription>
            Tải xuống danh sách tồn kho dưới dạng file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="export-format">Định dạng file</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger id="export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (Excel compatible)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format Description */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            {format === 'csv' ? (
              <div>
                <p className="font-medium">CSV Format</p>
                <p className="text-muted-foreground mt-1">
                  File CSV có thể mở bằng Excel, Google Sheets. Phù hợp để chỉnh sửa và import lại.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">JSON Format</p>
                <p className="text-muted-foreground mt-1">
                  File JSON cho developer hoặc tích hợp với hệ thống khác.
                </p>
              </div>
            )}
          </div>

          {/* Columns Info */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Các cột trong file:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Product ID, Product Name</li>
              <li>SKU, Variation ID, Size, Color</li>
              <li>Stock Quantity, Reserved, Available</li>
              <li>Stock Status, Low Stock Threshold</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Hủy
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="min-h-[44px]">
            {isExporting ? (
              'Đang xuất...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Tải xuống
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
