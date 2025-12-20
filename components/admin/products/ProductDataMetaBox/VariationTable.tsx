'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Handle cell click to start editing
  const handleCellClick = (rowId: string, field: string, currentValue: string | number | undefined) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue?.toString() || '');
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // Handle save (Enter key or blur)
  const handleSave = () => {
    if (!editingCell) return;

    const { rowId, field } = editingCell;

    // Special validation for stockQuantity
    if (field === 'stockQuantity' && editValue.trim()) {
      const numValue = parseFloat(editValue);
      
      // Check if value is a valid number
      if (isNaN(numValue)) {
        showToast('Số lượng phải là số hợp lệ', 'error');
        setEditingCell(null);
        setEditValue('');
        return;
      }
      
      // Check if value is negative
      const intValue = Math.floor(numValue);
      if (intValue < 0) {
        showToast('Số lượng không thể là số âm', 'error');
        setEditingCell(null);
        setEditValue('');
        return;
      }
      
      // Check if value is too large (prevent overflow)
      if (!isFinite(intValue) || intValue > Number.MAX_SAFE_INTEGER) {
        showToast('Số lượng quá lớn', 'error');
        setEditingCell(null);
        setEditValue('');
        return;
      }
    }

    const updatedVariations = variations.map((variation) => {
      if (variation.id !== rowId) return variation;

      const updated = { ...variation };
      const numValue = parseFloat(editValue);

      switch (field) {
        case 'sku':
          updated.sku = editValue.trim() || undefined;
          break;
        case 'costPrice':
          updated.costPrice = editValue.trim() ? (isNaN(numValue) ? undefined : numValue) : undefined;
          break;
        case 'regularPrice':
          updated.regularPrice = editValue.trim() ? (isNaN(numValue) ? undefined : numValue) : undefined;
          break;
        case 'salePrice':
          updated.salePrice = editValue.trim() ? (isNaN(numValue) ? undefined : numValue) : undefined;
          break;
        case 'stockQuantity':
          // Validation already done above, safe to set value
          updated.stockQuantity = editValue.trim() ? Math.floor(parseFloat(editValue)) : undefined;
          break;
        default:
          return variation;
      }

      return updated;
    });

    onVariationsChange(updatedVariations);
    setEditingCell(null);
    setEditValue('');
  };

  // Handle cancel (Escape key)
  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      // Tab navigation will be handled by browser, but we save current edit first
      if (editingCell) {
        handleSave();
      }
    }
  };

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

  const isEditing = (rowId: string, field: string) => {
    return editingCell?.rowId === rowId && editingCell?.field === field;
  };

  const getCellValue = (variation: Variation, field: string): string => {
    switch (field) {
      case 'sku':
        return variation.sku || '';
      case 'costPrice':
        return variation.costPrice?.toString() || '';
      case 'regularPrice':
        return variation.regularPrice?.toString() || '';
      case 'salePrice':
        return variation.salePrice?.toString() || '';
      case 'stockQuantity':
        return variation.stockQuantity?.toString() || '';
      default:
        return '';
    }
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
                  {isEditing(variation.id, 'sku') ? (
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={handleInputChange}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs"
                    />
                  ) : (
                    <div className="space-y-1">
                      <div
                        onClick={() => handleCellClick(variation.id, 'sku', variation.sku)}
                        className="px-2 py-1.5 text-sm rounded border border-transparent hover:border-border cursor-text min-h-[32px] flex items-center"
                      >
                        {variation.sku || <span className="text-muted-foreground">Click để nhập</span>}
                      </div>
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
                  )}
                </TableCell>

                {/* Cost Price */}
                <TableCell>
                  {isEditing(variation.id, 'costPrice') ? (
                    <Input
                      ref={inputRef}
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={handleInputChange}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs"
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(variation.id, 'costPrice', variation.costPrice)}
                      className="px-2 py-1.5 text-sm rounded border border-transparent hover:border-border cursor-text min-h-[32px] flex items-center"
                    >
                      {variation.costPrice ? `${variation.costPrice.toLocaleString('vi-VN')}đ` : <span className="text-muted-foreground">Click để nhập</span>}
                    </div>
                  )}
                </TableCell>

                {/* Regular Price */}
                <TableCell>
                  {isEditing(variation.id, 'regularPrice') ? (
                    <Input
                      ref={inputRef}
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={handleInputChange}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs"
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(variation.id, 'regularPrice', variation.regularPrice)}
                      className="px-2 py-1.5 text-sm rounded border border-transparent hover:border-border cursor-text min-h-[32px] flex items-center"
                    >
                      {variation.regularPrice ? `${variation.regularPrice.toLocaleString('vi-VN')}đ` : <span className="text-muted-foreground">Click để nhập</span>}
                    </div>
                  )}
                </TableCell>

                {/* Sale Price */}
                <TableCell>
                  {isEditing(variation.id, 'salePrice') ? (
                    <Input
                      ref={inputRef}
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={handleInputChange}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs"
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(variation.id, 'salePrice', variation.salePrice)}
                      className="px-2 py-1.5 text-sm rounded border border-transparent hover:border-border cursor-text min-h-[32px] flex items-center"
                    >
                      {variation.salePrice ? `${variation.salePrice.toLocaleString('vi-VN')}đ` : <span className="text-muted-foreground">Click để nhập</span>}
                    </div>
                  )}
                </TableCell>

                {/* Stock Quantity */}
                <TableCell>
                  {isEditing(variation.id, 'stockQuantity') ? (
                    <Input
                      ref={inputRef}
                      type="number"
                      step="1"
                      min="0"
                      value={editValue}
                      onChange={handleInputChange}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs"
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(variation.id, 'stockQuantity', variation.stockQuantity)}
                      className="px-2 py-1.5 text-sm rounded border border-transparent hover:border-border cursor-text min-h-[32px] flex items-center"
                    >
                      {variation.stockQuantity !== undefined ? variation.stockQuantity : <span className="text-muted-foreground">Click để nhập</span>}
                    </div>
                  )}
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
