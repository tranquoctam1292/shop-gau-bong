'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageIcon, Trash2, Copy, Upload, X, Info } from 'lucide-react';
import Image from 'next/image';
import { useToastContext } from '@/components/providers/ToastProvider';

export interface Variation {
  id: string;
  name: string;
  sku?: string;
  costPrice?: number;
  regularPrice?: number;
  salePrice?: number;
  stockQuantity?: number;
  image?: string;
  attributes: Record<string, string>;
}

/**
 * Buffered Input Cell Component
 * 
 * Optimized input component with local state to prevent parent re-renders on every keystroke.
 * Only updates parent state on blur or Enter key press.
 */
interface VariationCellInputProps {
  variationId: string;
  field: string;
  value: string | number | undefined;
  type?: 'text' | 'number';
  step?: string;
  min?: string;
  onSave: (variationId: string, field: string, value: string) => void;
  onCancel?: () => void;
  className?: string;
}

const VariationCellInput = memo(function VariationCellInput({
  variationId,
  field,
  value,
  type = 'text',
  step,
  min,
  onSave,
  onCancel,
  className = '',
}: VariationCellInputProps) {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when prop value changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value?.toString() || '');
    }
  }, [value, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback(() => {
    setIsEditing(true);
    setLocalValue(value?.toString() || '');
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only update local state - no parent update
    setLocalValue(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Update parent only on blur
    onSave(variationId, field, localValue);
  }, [variationId, field, localValue, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      onSave(variationId, field, localValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setLocalValue(value?.toString() || ''); // Reset to original value
      onCancel?.();
    } else if (e.key === 'Tab') {
      // Save before tabbing away
      setIsEditing(false);
      onSave(variationId, field, localValue);
    }
  }, [variationId, field, localValue, value, onSave, onCancel]);

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        step={step}
        min={min}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`h-8 text-xs ${className}`}
      />
    );
  }

  // Format display value based on field type
  const getDisplayValue = () => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-muted-foreground">Click để nhập</span>;
    }
    
    if (type === 'number') {
      const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
      if (isNaN(numValue)) {
        return <span className="text-muted-foreground">Click để nhập</span>;
      }
      // Check if field is price (costPrice, regularPrice, salePrice)
      const isPriceField = field === 'costPrice' || field === 'regularPrice' || field === 'salePrice';
      return <span>{numValue.toLocaleString('vi-VN')}{isPriceField ? 'đ' : ''}</span>;
    }
    
    return <span>{value}</span>;
  };

  return (
    <div
      onClick={handleClick}
      className={`px-2 py-1.5 text-sm rounded border border-transparent hover:border-border cursor-text min-h-[32px] flex items-center ${className}`}
    >
      {getDisplayValue()}
    </div>
  );
});

interface VariationTableProps {
  variations: Variation[];
  onVariationsChange: (variations: Variation[]) => void;
  productName?: string; // For SKU auto-generation
  categoryId?: string; // For SKU auto-generation
  autoGenerateSku?: boolean; // Auto-generate SKU enabled
  previewSkus?: Record<string, string>; // Preview SKUs for live preview
  hasIncrementToken?: boolean; // Pattern has {INCREMENT} token
}

/**
 * Variation Table - Spreadsheet-like table với inline editing
 * Features:
 * - Inline editing (click cell to edit)
 * - Tab key để move to next cell
 * - Enter để save, Escape để cancel
 * - Row selection với checkbox
 * - Bulk actions (Delete selected)
 * - Image upload per variation
 */
export function VariationTable({
  variations,
  onVariationsChange,
  productName,
  categoryId,
  autoGenerateSku = false,
  previewSkus = {},
  hasIncrementToken = false,
}: VariationTableProps) {
  const { showToast } = useToastContext();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Optimized save handler - only called on blur/Enter, not on every keystroke
  const handleCellSave = useCallback((variationId: string, field: string, value: string) => {

    // Special validation for stockQuantity
    if (field === 'stockQuantity' && value.trim()) {
      const numValue = parseFloat(value);
      
      // Check if value is a valid number
      if (isNaN(numValue)) {
        showToast('Số lượng phải là số hợp lệ', 'error');
        return;
      }
      
      // Check if value is negative
      const intValue = Math.floor(numValue);
      if (intValue < 0) {
        showToast('Số lượng không thể là số âm', 'error');
        return;
      }
      
      // Check if value is too large (prevent overflow)
      if (!isFinite(intValue) || intValue > Number.MAX_SAFE_INTEGER) {
        showToast('Số lượng quá lớn', 'error');
        return;
      }
    }

    const updatedVariations = variations.map((variation) => {
      if (variation.id !== variationId) return variation;

      const updated = { ...variation };
      const numValue = parseFloat(value);

      switch (field) {
        case 'sku':
          updated.sku = value.trim() || undefined;
          break;
        case 'costPrice':
          updated.costPrice = value.trim() ? (isNaN(numValue) ? undefined : numValue) : undefined;
          break;
        case 'regularPrice':
          updated.regularPrice = value.trim() ? (isNaN(numValue) ? undefined : numValue) : undefined;
          break;
        case 'salePrice':
          updated.salePrice = value.trim() ? (isNaN(numValue) ? undefined : numValue) : undefined;
          break;
        case 'stockQuantity':
          // Validation already done above, safe to set value
          updated.stockQuantity = value.trim() ? Math.floor(parseFloat(value)) : undefined;
          break;
        default:
          return variation;
      }

      return updated;
    });

    onVariationsChange(updatedVariations);
  }, [variations, onVariationsChange, showToast]);

  // Handle image upload
  const handleImageUpload = (variationId: string, file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Convert to data URL (in production, upload to server)
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updatedVariations = variations.map((variation) =>
        variation.id === variationId ? { ...variation, image: dataUrl } : variation
      );
      onVariationsChange(updatedVariations);
    };
    reader.onerror = () => {
      alert('Có lỗi xảy ra khi đọc file');
    };
    reader.readAsDataURL(file);
  };

  // Handle image remove
  const handleImageRemove = (variationId: string) => {
    const updatedVariations = variations.map((variation) =>
      variation.id === variationId ? { ...variation, image: undefined } : variation
    );
    onVariationsChange(updatedVariations);
  };

  // Handle row selection
  const handleRowSelect = (variationId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(variationId);
    } else {
      newSelected.delete(variationId);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(variations.map((v) => v.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Handle delete selected
  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa ${selectedRows.size} biến thể đã chọn?`
    );
    if (!confirmed) return;

    const updatedVariations = variations.filter((v) => !selectedRows.has(v.id));
    onVariationsChange(updatedVariations);
    setSelectedRows(new Set());
  };

  // Handle duplicate variation
  const handleDuplicate = (variationId: string) => {
    const variation = variations.find((v) => v.id === variationId);
    if (!variation) return;

    const duplicated: Variation = {
      ...variation,
      id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${variation.name} (Copy)`,
      sku: undefined, // Clear SKU for duplicate
    };

    const index = variations.findIndex((v) => v.id === variationId);
    const updatedVariations = [
      ...variations.slice(0, index + 1),
      duplicated,
      ...variations.slice(index + 1),
    ];
    onVariationsChange(updatedVariations);
  };

  // Handle delete single variation
  const handleDelete = (variationId: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa biến thể này?');
    if (!confirmed) return;

    const updatedVariations = variations.filter((v) => v.id !== variationId);
    onVariationsChange(updatedVariations);
  };


  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">
            Đã chọn {selectedRows.size} biến thể
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Xóa đã chọn
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.size === variations.length && variations.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-20">Hình ảnh</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead className="w-32">SKU</TableHead>
              <TableHead className="w-32">Giá vốn</TableHead>
              <TableHead className="w-32">Giá bán</TableHead>
              <TableHead className="w-32">Giá KM</TableHead>
              <TableHead className="w-32">Tồn kho</TableHead>
              <TableHead className="w-32">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variations.map((variation) => (
              <TableRow key={variation.id}>
                {/* Checkbox */}
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(variation.id)}
                    onCheckedChange={(checked) => handleRowSelect(variation.id, checked as boolean)}
                  />
                </TableCell>

                {/* Image */}
                <TableCell>
                  <div className="relative w-16 h-16 rounded border border-border overflow-hidden bg-muted/50">
                    {variation.image ? (
                      <>
                        <Image
                          src={variation.image}
                          alt={variation.name}
                          fill
                          className="object-cover"
                          unoptimized={variation.image.startsWith('data:')}
                          sizes="64px" // Fixed size for admin table cell
                        />
                        <button
                          onClick={() => handleImageRemove(variation.id)}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl opacity-0 hover:opacity-100 transition-opacity"
                          title="Xóa hình ảnh"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(variation.id, file);
                            e.target.value = ''; // Reset to allow re-uploading same file
                          }}
                        />
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </label>
                    )}
                  </div>
                </TableCell>

                {/* Name (read-only) */}
                <TableCell>
                  <div className="text-sm font-medium">{variation.name}</div>
                </TableCell>

                {/* SKU */}
                <TableCell>
                  <div className="space-y-1">
                    <VariationCellInput
                      variationId={variation.id}
                      field="sku"
                      value={variation.sku}
                      type="text"
                      onSave={handleCellSave}
                    />
                    {/* Live Preview */}
                    {autoGenerateSku && !variation.sku && previewSkus[variation.id] && (
                      <div className="px-2 space-y-1">
                        {hasIncrementToken && previewSkus[variation.id].includes('###') ? (
                          <>
                            <div className="text-xs text-muted-foreground italic">
                              Preview: {previewSkus[variation.id]}
                            </div>
                            {/* FIX: Warning label for INCREMENT token - make it clear that number is not final */}
                            <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                              <Info className="h-3 w-3 flex-shrink-0" />
                              <span>
                                <strong>Lưu ý:</strong> Mã số cuối cùng sẽ được cấp phát sau khi lưu thành công
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">
                            Preview: {previewSkus[variation.id]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Cost Price */}
                <TableCell>
                  <VariationCellInput
                    variationId={variation.id}
                    field="costPrice"
                    value={variation.costPrice}
                    type="number"
                    step="0.01"
                    onSave={handleCellSave}
                  />
                </TableCell>

                {/* Regular Price */}
                <TableCell>
                  <VariationCellInput
                    variationId={variation.id}
                    field="regularPrice"
                    value={variation.regularPrice}
                    type="number"
                    step="0.01"
                    onSave={handleCellSave}
                  />
                </TableCell>

                {/* Sale Price */}
                <TableCell>
                  <VariationCellInput
                    variationId={variation.id}
                    field="salePrice"
                    value={variation.salePrice}
                    type="number"
                    step="0.01"
                    onSave={handleCellSave}
                  />
                </TableCell>

                {/* Stock Quantity */}
                <TableCell>
                  <VariationCellInput
                    variationId={variation.id}
                    field="stockQuantity"
                    value={variation.stockQuantity}
                    type="number"
                    step="1"
                    min="0"
                    onSave={handleCellSave}
                  />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(variation.id)}
                      className="h-7 w-7 p-0"
                      title="Nhân đôi"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(variation.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {variations.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Chưa có biến thể nào
        </div>
      )}
    </div>
  );
}
