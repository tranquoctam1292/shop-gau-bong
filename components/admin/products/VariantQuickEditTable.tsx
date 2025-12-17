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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { useToastContext } from '@/components/providers/ToastProvider';

interface Variant {
  id: string;
  size: string;
  color?: string;
  colorCode?: string;
  price: number;
  stock?: number;
  image?: string;
  sku?: string;
}

interface VariantQuickEditTableProps {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  bulkUpdate: boolean;
  onBulkUpdateChange: (enabled: boolean) => void;
}

export function VariantQuickEditTable({
  variants,
  onVariantsChange,
  bulkUpdate,
  onBulkUpdateChange,
}: VariantQuickEditTableProps) {
  const { showToast } = useToastContext();
  const [editingCell, setEditingCell] = useState<{ variantId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [bulkValues, setBulkValues] = useState({
    sku: '',
    price: '',
    stock: '',
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Handle cell click to start editing
  const handleCellClick = (variantId: string, field: string, currentValue: string | number | undefined) => {
    if (bulkUpdate) return; // Don't allow individual editing in bulk mode
    setEditingCell({ variantId, field });
    setEditValue(currentValue?.toString() || '');
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // Handle save (Enter key or blur)
  const handleSave = () => {
    if (!editingCell) return;

    const { variantId, field } = editingCell;
    const updatedVariants = variants.map((variant) => {
      if (variant.id === variantId) {
        const updated = { ...variant };
        if (field === 'sku') {
          updated.sku = editValue;
        } else if (field === 'price') {
          updated.price = parseFloat(editValue) || 0;
        } else if (field === 'stock') {
          updated.stock = parseInt(editValue, 10) || 0;
        }
        return updated;
      }
      return variant;
    });

    onVariantsChange(updatedVariants);
    setEditingCell(null);
    setEditValue('');
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Check if cell is being edited
  const isEditing = (variantId: string, field: string) => {
    return editingCell?.variantId === variantId && editingCell?.field === field;
  };

  // Handle bulk update with validation
  const handleBulkUpdate = () => {
    // Validate inputs before applying
    const errors: string[] = [];
    
    if (bulkValues.price !== '') {
      const parsedPrice = parseFloat(bulkValues.price);
      if (isNaN(parsedPrice)) {
        errors.push('Giá không hợp lệ');
      } else if (parsedPrice < 0) {
        errors.push('Giá phải >= 0');
      }
    }
    
    if (bulkValues.stock !== '') {
      const parsedStock = parseInt(bulkValues.stock, 10);
      if (isNaN(parsedStock)) {
        errors.push('Số lượng không hợp lệ');
      } else if (parsedStock < 0) {
        errors.push('Số lượng phải >= 0');
      }
    }
    
    // Show error toast if validation fails
    if (errors.length > 0) {
      showToast(errors[0], 'error');
      return;
    }
    
    // Apply updates if validation passes
    const updatedVariants = variants.map((variant) => {
      const updated = { ...variant };
      if (bulkValues.sku) {
        updated.sku = bulkValues.sku;
      }
      // Fix: Allow price = 0 by checking for empty string instead of truthy
      if (bulkValues.price !== '') {
        const parsedPrice = parseFloat(bulkValues.price);
        if (!isNaN(parsedPrice) && parsedPrice >= 0) {
          updated.price = parsedPrice;
        }
      }
      // Fix: Allow stock = 0 by checking for empty string
      if (bulkValues.stock !== '') {
        const parsedStock = parseInt(bulkValues.stock, 10);
        if (!isNaN(parsedStock) && parsedStock >= 0) {
          updated.stock = parsedStock;
        }
      }
      return updated;
    });

    onVariantsChange(updatedVariants);
    setBulkValues({ sku: '', price: '', stock: '' });
    showToast('Đã áp dụng cho tất cả biến thể', 'success');
  };

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Bulk Update Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="bulk-update-variants"
          checked={bulkUpdate}
          onCheckedChange={(checked) => onBulkUpdateChange(checked as boolean)}
        />
        <Label htmlFor="bulk-update-variants" className="cursor-pointer text-slate-900">
          Áp dụng chung cho tất cả biến thể
        </Label>
      </div>

      {/* Bulk Edit Panel */}
      {bulkUpdate && (
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-sku" className="text-slate-900">SKU chung</Label>
              <Input
                id="bulk-sku"
                placeholder="Nhập SKU..."
                value={bulkValues.sku}
                onChange={(e) => setBulkValues({ ...bulkValues, sku: e.target.value })}
                className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-price" className="text-slate-900">Giá chung (đ)</Label>
              <Input
                id="bulk-price"
                type="number"
                step="1000"
                min="0"
                placeholder="Nhập giá..."
                value={bulkValues.price}
                onChange={(e) => setBulkValues({ ...bulkValues, price: e.target.value })}
                className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-stock" className="text-slate-900">Số lượng chung</Label>
              <Input
                id="bulk-stock"
                type="number"
                min="0"
                placeholder="Nhập số lượng..."
                value={bulkValues.stock}
                onChange={(e) => setBulkValues({ ...bulkValues, stock: e.target.value })}
                className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
              />
            </div>
          </div>
          <Button
            onClick={handleBulkUpdate}
            className="w-full bg-slate-900 text-white hover:bg-slate-800"
          >
            Áp dụng
          </Button>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <TableHead className="w-16">Hình ảnh</TableHead>
              <TableHead>Thuộc tính</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Giá (đ)</TableHead>
              <TableHead>Số lượng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                {/* Thumbnail - 40x40px */}
                <TableCell>
                  {variant.image ? (
                    <div className="relative w-10 h-10">
                      <Image
                        src={variant.image}
                        alt={`${variant.size}${variant.color ? ` - ${variant.color}` : ''}`}
                        fill
                        className="object-cover rounded"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                      <span className="text-xs text-slate-400">N/A</span>
                    </div>
                  )}
                </TableCell>

                {/* Attributes (Size/Color) */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-900">{variant.size}</div>
                    {variant.color && (
                      <div className="flex items-center gap-1.5">
                        {variant.colorCode && (
                          <div
                            className="w-3 h-3 rounded border border-slate-300"
                            style={{ backgroundColor: variant.colorCode }}
                          />
                        )}
                        <span className="text-xs text-slate-500">{variant.color}</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* SKU */}
                <TableCell>
                  {isEditing(variant.id, 'sku') ? (
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={handleInputChange}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs border-slate-200 focus:ring-2 focus:ring-slate-950"
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(variant.id, 'sku', variant.sku)}
                      className={`px-2 py-1.5 text-sm rounded border border-transparent min-h-[32px] flex items-center transition-colors ${
                        bulkUpdate 
                          ? 'cursor-default opacity-50' 
                          : 'cursor-text hover:bg-slate-50'
                      }`}
                    >
                      {variant.sku || <span className="text-slate-400">Click để nhập</span>}
                    </div>
                  )}
                </TableCell>

                {/* Price */}
                <TableCell>
                  {isEditing(variant.id, 'price') ? (
                    <Input
                      ref={inputRef}
                      type="number"
                      step="1000"
                      min="0"
                      value={editValue}
                      onChange={handleInputChange}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs border-slate-200 focus:ring-2 focus:ring-slate-950"
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(variant.id, 'price', variant.price)}
                      className={`px-2 py-1.5 text-sm rounded border border-transparent min-h-[32px] flex items-center transition-colors ${
                        bulkUpdate 
                          ? 'cursor-default opacity-50' 
                          : 'cursor-text hover:bg-slate-50'
                      }`}
                    >
                      {new Intl.NumberFormat('vi-VN').format(variant.price || 0)}
                    </div>
                  )}
                </TableCell>

                {/* Stock */}
                <TableCell>
                  {isEditing(variant.id, 'stock') ? (
                    <Input
                      ref={inputRef}
                      type="number"
                      min="0"
                      value={editValue}
                      onChange={handleInputChange}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="h-8 text-xs border-slate-200 focus:ring-2 focus:ring-slate-950"
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(variant.id, 'stock', variant.stock)}
                      className={`px-2 py-1.5 text-sm rounded border border-transparent min-h-[32px] flex items-center transition-colors ${
                        bulkUpdate 
                          ? 'cursor-default opacity-50' 
                          : 'cursor-text hover:bg-slate-50'
                      }`}
                    >
                      {variant.stock !== undefined ? variant.stock : <span className="text-slate-400">Click để nhập</span>}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

