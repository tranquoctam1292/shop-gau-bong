'use client';

import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { Check, Search, ArrowUpDown, ArrowUp, ArrowDown, Package, MoreVertical, Eye, ChevronDown } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { useToastContext } from '@/components/providers/ToastProvider';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  isLoading?: boolean; // PHASE 4: Variant Table Empty/Loading State (7.11.12)
}

export function VariantQuickEditTable({
  variants,
  onVariantsChange,
  bulkUpdate,
  onBulkUpdateChange,
  isLoading = false, // PHASE 4: Variant Table Empty/Loading State (7.11.12)
}: VariantQuickEditTableProps) {
  const { showToast } = useToastContext();
  const [editingCell, setEditingCell] = useState<{ variantId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  // PHASE 1: Variant Table Visual Feedback (7.11.7) - Track edited variants
  const [editedVariants, setEditedVariants] = useState<Set<string>>(new Set());
  const [originalVariants, setOriginalVariants] = useState<Map<string, Variant>>(new Map());
  const [bulkValues, setBulkValues] = useState({
    sku: '',
    price: '',
    stock: '',
  });
  const inputRef = useRef<HTMLInputElement>(null);
  
  // PHASE 3: Variant Table Search/Filter (7.10.2)
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'size' | 'color' | 'sku' | 'price' | 'stock' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // PHASE 4: Bulk Operations trong Variant Table (7.10.4)
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [bulkOperation, setBulkOperation] = useState<'increase_price' | 'decrease_price' | 'set_stock' | null>(null);
  const [bulkOperationValue, setBulkOperationValue] = useState<string>('');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewChanges, setPreviewChanges] = useState<Array<{ variant: Variant; newPrice?: number; newStock?: number }>>([]);
  
  // PHASE 1: Variant Table Visual Feedback (7.11.7) - Track original values on mount
  useEffect(() => {
    const originalMap = new Map<string, Variant>();
    variants.forEach((v) => {
      originalMap.set(v.id, { ...v });
    });
    setOriginalVariants(originalMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount - intentionally exclude variants to store initial snapshot

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
    // Find variant in original variants array (not filtered) to maintain correct order
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
        
        // PHASE 1: Variant Table Visual Feedback (7.11.7) - Mark variant as edited
        const original = originalVariants.get(variantId);
        if (original) {
          const hasChanged = 
            updated.sku !== original.sku ||
            updated.price !== original.price ||
            updated.stock !== original.stock;
          
          if (hasChanged) {
            setEditedVariants((prev) => new Set([...prev, variantId]));
          } else {
            // Check if all fields match original
            const allMatch = 
              updated.sku === original.sku &&
              updated.price === original.price &&
              updated.stock === original.stock;
            if (allMatch) {
              setEditedVariants((prev) => {
                const next = new Set(prev);
                next.delete(variantId);
                return next;
              });
            }
          }
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

  // PHASE 3: Variant Table Search/Filter (7.10.2) - Filter and sort variants
  const filteredAndSortedVariants = useMemo(() => {
    let filtered = variants;
    
    // Filter by search term (size, color, SKU)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = variants.filter((variant) => {
        const matchesSize = variant.size.toLowerCase().includes(searchLower);
        const matchesColor = variant.color?.toLowerCase().includes(searchLower) || false;
        const matchesSku = variant.sku?.toLowerCase().includes(searchLower) || false;
        return matchesSize || matchesColor || matchesSku;
      });
    }
    
    // Sort variants
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';
        
        switch (sortField) {
          case 'size':
            aValue = a.size;
            bValue = b.size;
            break;
          case 'color':
            aValue = a.color || '';
            bValue = b.color || '';
            break;
          case 'sku':
            aValue = a.sku || '';
            bValue = b.sku || '';
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'stock':
            aValue = a.stock ?? 0;
            bValue = b.stock ?? 0;
            break;
        }
        
        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue, 'vi', { numeric: true, sensitivity: 'base' });
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        
        // Handle number comparison
        const comparison = (aValue as number) - (bValue as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [variants, searchTerm, sortField, sortDirection]);
  
  // Handle sort field change
  const handleSortFieldChange = (field: 'size' | 'color' | 'sku' | 'price' | 'stock' | null) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // PHASE 4: Bulk Operations trong Variant Table (7.10.4) - Handle variant selection
  const handleToggleVariantSelection = useCallback((variantId: string) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  }, []);

  const handleSelectAllVariants = useCallback(() => {
    if (selectedVariantIds.size === filteredAndSortedVariants.length) {
      setSelectedVariantIds(new Set());
    } else {
      setSelectedVariantIds(new Set(filteredAndSortedVariants.map((v) => v.id)));
    }
  }, [selectedVariantIds.size, filteredAndSortedVariants]);

  // PHASE 4: Bulk Operations trong Variant Table (7.10.4) - Generate preview changes
  const generatePreviewChanges = useCallback(() => {
    if (!bulkOperation || !bulkOperationValue) return [];

    const selectedVariants = filteredAndSortedVariants.filter((v) => selectedVariantIds.has(v.id));
    if (selectedVariants.length === 0) return [];

    const changes: Array<{ variant: Variant; newPrice?: number; newStock?: number }> = [];

    if (bulkOperation === 'increase_price' || bulkOperation === 'decrease_price') {
      const percentage = parseFloat(bulkOperationValue);
      if (isNaN(percentage) || percentage < 0) return [];

      selectedVariants.forEach((variant) => {
        const currentPrice = variant.price || 0;
        let newPrice: number;
        
        if (bulkOperation === 'increase_price') {
          newPrice = currentPrice * (1 + percentage / 100);
        } else {
          newPrice = Math.max(0, currentPrice * (1 - percentage / 100));
        }
        
        changes.push({
          variant,
          newPrice: Math.round(newPrice),
        });
      });
    } else if (bulkOperation === 'set_stock') {
      const stockValue = parseInt(bulkOperationValue, 10);
      if (isNaN(stockValue) || stockValue < 0) return [];

      selectedVariants.forEach((variant) => {
        changes.push({
          variant,
          newStock: stockValue,
        });
      });
    }

    return changes;
  }, [bulkOperation, bulkOperationValue, selectedVariantIds, filteredAndSortedVariants]);

  // PHASE 4: Bulk Operations trong Variant Table (7.10.4) - Apply bulk operation
  const handleApplyBulkOperation = useCallback(() => {
    const changes = generatePreviewChanges();
    if (changes.length === 0) {
      showToast('Không có thay đổi nào để áp dụng', 'warning');
      return;
    }

    const updatedVariants = variants.map((variant) => {
      const change = changes.find((c) => c.variant.id === variant.id);
      if (!change) return variant;

      const updated = { ...variant };
      if (change.newPrice !== undefined) {
        updated.price = change.newPrice;
      }
      if (change.newStock !== undefined) {
        updated.stock = change.newStock;
      }
      return updated;
    });

    onVariantsChange(updatedVariants);
    setBulkOperation(null);
    setBulkOperationValue('');
    setSelectedVariantIds(new Set());
    setShowPreviewDialog(false);
    showToast(`Đã áp dụng cho ${changes.length} biến thể`, 'success');
  }, [generatePreviewChanges, variants, onVariantsChange, showToast]);

  // PHASE 2: VariantQuickEditTable Performance (7.7.1) - Virtualization threshold
  const VIRTUALIZATION_THRESHOLD = 20; // Enable virtualization for 20+ variants
  const shouldVirtualize = filteredAndSortedVariants.length >= VIRTUALIZATION_THRESHOLD;
  
  // PHASE 2: VariantQuickEditTable Performance (7.7.1) - Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedVariants.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 5, // Render 5 extra rows outside viewport for smooth scrolling
  });

  // PHASE 4: Variant Table Empty/Loading State (7.11.12) - Don't return null, show empty/loading state

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

      {/* PHASE 4: Bulk Operations trong Variant Table (7.10.4) - Bulk Operations Panel */}
      {!bulkUpdate && filteredAndSortedVariants.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-variants"
                  checked={selectedVariantIds.size > 0 && selectedVariantIds.size === filteredAndSortedVariants.length}
                  onCheckedChange={handleSelectAllVariants}
                />
                <Label htmlFor="select-all-variants" className="cursor-pointer text-slate-900 text-sm font-medium">
                  Chọn tất cả ({selectedVariantIds.size}/{filteredAndSortedVariants.length})
                </Label>
              </div>
            </div>
            {selectedVariantIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Select value={bulkOperation || ''} onValueChange={(value) => setBulkOperation(value as typeof bulkOperation)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Chọn thao tác" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase_price">Tăng giá X%</SelectItem>
                    <SelectItem value="decrease_price">Giảm giá X%</SelectItem>
                    <SelectItem value="set_stock">Đặt số lượng = X</SelectItem>
                  </SelectContent>
                </Select>
                {bulkOperation && (
                  <>
                    <Input
                      type="number"
                      min="0"
                      step={bulkOperation === 'set_stock' ? '1' : '0.1'}
                      placeholder={bulkOperation === 'set_stock' ? 'Số lượng' : '%'}
                      value={bulkOperationValue}
                      onChange={(e) => setBulkOperationValue(e.target.value)}
                      className="w-[100px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const changes = generatePreviewChanges();
                        if (changes.length === 0) {
                          showToast('Vui lòng nhập giá trị hợp lệ', 'warning');
                          return;
                        }
                        setPreviewChanges(changes);
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Xem trước
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE 3: Variant Table Search/Filter (7.10.2) - Search and Sort UI */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo size, màu, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
          />
        </div>
        
        {/* Sort Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={sortField === 'size' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortFieldChange('size')}
            className="text-xs"
          >
            Size
            {sortField === 'size' ? (
              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
            )}
          </Button>
          <Button
            type="button"
            variant={sortField === 'color' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortFieldChange('color')}
            className="text-xs"
          >
            Màu
            {sortField === 'color' ? (
              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
            )}
          </Button>
          <Button
            type="button"
            variant={sortField === 'sku' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortFieldChange('sku')}
            className="text-xs"
          >
            SKU
            {sortField === 'sku' ? (
              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
            )}
          </Button>
          <Button
            type="button"
            variant={sortField === 'price' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortFieldChange('price')}
            className="text-xs"
          >
            Giá
            {sortField === 'price' ? (
              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
            )}
          </Button>
          <Button
            type="button"
            variant={sortField === 'stock' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortFieldChange('stock')}
            className="text-xs"
          >
            Tồn kho
            {sortField === 'stock' ? (
              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
            )}
          </Button>
          {sortField && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSortField(null);
                setSortDirection('asc');
              }}
              className="text-xs"
            >
              Xóa sort
            </Button>
          )}
        </div>
      </div>

      {/* PHASE 2: VariantQuickEditTable Performance (7.7.1) - Virtualized table container */}
      <div 
        ref={parentRef}
        className={`overflow-x-auto border border-slate-200 rounded-md ${shouldVirtualize ? 'overflow-y-auto max-h-[600px]' : ''}`}
      >
        <Table>
          <TableHeader className={shouldVirtualize ? 'sticky top-0 z-10 bg-white' : ''}>
            <TableRow className="bg-slate-100">
              {/* PHASE 4: Bulk Operations trong Variant Table (7.10.4) - Select checkbox column */}
              {!bulkUpdate && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedVariantIds.size > 0 && selectedVariantIds.size === filteredAndSortedVariants.length}
                    onCheckedChange={handleSelectAllVariants}
                    aria-label="Chọn tất cả"
                  />
                </TableHead>
              )}
              <TableHead className="w-16">Hình ảnh</TableHead>
              <TableHead>Thuộc tính</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Giá (đ)</TableHead>
              <TableHead>Số lượng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // PHASE 4: Variant Table Empty/Loading State (7.11.12) - Skeleton loader
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <div className="w-10 h-10 bg-slate-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
                        <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : variants.length === 0 ? (
              // PHASE 4: Variant Table Empty/Loading State (7.11.12) - Empty state when no variants
              <TableRow>
                <TableCell colSpan={bulkUpdate ? 5 : 6} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">Chưa có biến thể</p>
                      <p className="text-xs text-slate-500">Sản phẩm này chưa có biến thể nào được tạo.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAndSortedVariants.length === 0 ? (
              // PHASE 4: Variant Table Empty/Loading State (7.11.12) - Empty state for filtered results
              <TableRow>
                <TableCell colSpan={bulkUpdate ? 5 : 6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">Không tìm thấy biến thể nào</p>
                    <p className="text-xs text-slate-500">Không có biến thể nào phù hợp với điều kiện tìm kiếm.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : shouldVirtualize ? (
              // PHASE 2: VariantQuickEditTable Performance (7.7.1) - Virtual scrolling
              <>
                {/* Spacer for virtual scrolling - maintains table structure */}
                <tr style={{ height: rowVirtualizer.getTotalSize() }} />
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const variant = filteredAndSortedVariants[virtualRow.index];
                  const isEdited = editedVariants.has(variant.id);
                  const original = originalVariants.get(variant.id);
                  
                  return (
                    <VariantRow
                      key={variant.id}
                      variant={variant}
                      isEdited={isEdited}
                      original={original}
                      isEditing={isEditing}
                      editingCell={editingCell}
                      editValue={editValue}
                      bulkUpdate={bulkUpdate}
                      inputRef={inputRef}
                      onCellClick={handleCellClick}
                      onInputChange={handleInputChange}
                      onSave={handleSave}
                      onKeyDown={handleKeyDown}
                      isSelected={selectedVariantIds.has(variant.id)}
                      onToggleSelection={() => handleToggleVariantSelection(variant.id)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    />
                  );
                })}
              </>
            ) : (
              // PHASE 2: VariantQuickEditTable Performance (7.7.1) - Regular rendering for < 20 variants
              filteredAndSortedVariants.map((variant) => {
                const isEdited = editedVariants.has(variant.id);
                const original = originalVariants.get(variant.id);
                
                return (
                  <VariantRow
                    key={variant.id}
                    variant={variant}
                    isEdited={isEdited}
                    original={original}
                    isEditing={isEditing}
                    editingCell={editingCell}
                    editValue={editValue}
                    bulkUpdate={bulkUpdate}
                    inputRef={inputRef}
                    onCellClick={handleCellClick}
                    onInputChange={handleInputChange}
                    onSave={handleSave}
                    onKeyDown={handleKeyDown}
                    isSelected={selectedVariantIds.has(variant.id)}
                    onToggleSelection={() => handleToggleVariantSelection(variant.id)}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* PHASE 4: Bulk Operations trong Variant Table (7.10.4) - Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Xem trước thay đổi</DialogTitle>
            <DialogDescription>
              {previewChanges.length} biến thể sẽ được cập nhật
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thuộc tính</TableHead>
                  <TableHead>Giá hiện tại</TableHead>
                  <TableHead>Giá mới</TableHead>
                  <TableHead>Số lượng hiện tại</TableHead>
                  <TableHead>Số lượng mới</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewChanges.map((change) => (
                  <TableRow key={change.variant.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{change.variant.size}</div>
                        {change.variant.color && (
                          <div className="text-xs text-slate-500">{change.variant.color}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('vi-VN').format(change.variant.price || 0)} đ
                    </TableCell>
                    <TableCell>
                      {change.newPrice !== undefined ? (
                        <span className="font-semibold text-green-600">
                          {new Intl.NumberFormat('vi-VN').format(change.newPrice)} đ
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{change.variant.stock ?? 0}</TableCell>
                    <TableCell>
                      {change.newStock !== undefined ? (
                        <span className="font-semibold text-green-600">{change.newStock}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleApplyBulkOperation}>
              Áp dụng thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// PHASE 2: VariantQuickEditTable Performance (7.7.1) - Memoized VariantRow component
interface VariantRowProps {
  variant: Variant;
  isEdited: boolean;
  original: Variant | undefined;
  isEditing: (variantId: string, field: string) => boolean;
  editingCell: { variantId: string; field: string } | null;
  editValue: string;
  bulkUpdate: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onCellClick: (variantId: string, field: string, currentValue: string | number | undefined) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isSelected?: boolean; // PHASE 4: Bulk Operations trong Variant Table (7.10.4)
  onToggleSelection?: () => void; // PHASE 4: Bulk Operations trong Variant Table (7.10.4)
  style?: React.CSSProperties;
}

const VariantRow = memo(function VariantRow({
  variant,
  isEdited,
  original,
  isEditing,
  editingCell,
  editValue,
  bulkUpdate,
  inputRef,
  onCellClick,
  onInputChange,
  onSave,
  onKeyDown,
  isSelected = false,
  onToggleSelection,
  style,
}: VariantRowProps) {
  return (
    <TableRow 
      style={style}
      className={isEdited ? 'bg-blue-50/50 hover:bg-blue-50' : ''}
    >
                {/* PHASE 4: Bulk Operations trong Variant Table (7.10.4) - Select checkbox */}
                {!bulkUpdate && onToggleSelection && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={onToggleSelection}
                      aria-label={`Chọn biến thể ${variant.size}${variant.color ? ` - ${variant.color}` : ''}`}
                    />
                  </TableCell>
                )}
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
                    {variant.color && typeof variant.color === 'string' && variant.color.trim() && (
                      <div className="flex items-center gap-1.5">
                        {variant.colorCode && typeof variant.colorCode === 'string' && variant.colorCode.trim() && (
                          <div
                            className="w-3 h-3 rounded border border-slate-300 flex-shrink-0"
                            style={{ backgroundColor: variant.colorCode }}
                            title={variant.colorCode}
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
            onChange={onInputChange}
            onBlur={onSave}
            onKeyDown={onKeyDown}
            className="h-8 text-xs border-blue-400 focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div
            onClick={() => onCellClick(variant.id, 'sku', variant.sku)}
            className={`px-2 py-1.5 text-sm rounded border min-h-[32px] flex items-center gap-1 transition-colors ${
                        bulkUpdate 
                ? 'cursor-default opacity-50 border-transparent' 
                : original && variant.sku !== original.sku
                ? 'cursor-text hover:bg-blue-50 border-blue-200 bg-blue-50/50'
                : 'cursor-text hover:bg-slate-50 border-transparent'
                      }`}
            title={original && variant.sku !== original.sku ? `Gốc: ${original.sku || 'N/A'} → Mới: ${variant.sku || 'N/A'}` : undefined}
                    >
                      {variant.sku || <span className="text-slate-400">Click để nhập</span>}
            {original && variant.sku !== original.sku && (
              <Check className="h-3 w-3 text-blue-600 flex-shrink-0" />
            )}
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
            onChange={onInputChange}
            onBlur={onSave}
            onKeyDown={onKeyDown}
            className="h-8 text-xs border-blue-400 focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div
            onClick={() => onCellClick(variant.id, 'price', variant.price)}
            className={`px-2 py-1.5 text-sm rounded border min-h-[32px] flex items-center gap-1 transition-colors ${
                        bulkUpdate 
                ? 'cursor-default opacity-50 border-transparent' 
                : original && variant.price !== original.price
                ? 'cursor-text hover:bg-blue-50 border-blue-200 bg-blue-50/50'
                : 'cursor-text hover:bg-slate-50 border-transparent'
                      }`}
            title={original && variant.price !== original.price ? `Gốc: ${new Intl.NumberFormat('vi-VN').format(original.price || 0)} đ → Mới: ${new Intl.NumberFormat('vi-VN').format(variant.price || 0)} đ` : undefined}
                    >
                      {new Intl.NumberFormat('vi-VN').format(variant.price || 0)}
            {original && variant.price !== original.price && (
              <Check className="h-3 w-3 text-blue-600 flex-shrink-0" />
            )}
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
            onChange={onInputChange}
            onBlur={onSave}
            onKeyDown={onKeyDown}
            className="h-8 text-xs border-blue-400 focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div
            onClick={() => onCellClick(variant.id, 'stock', variant.stock)}
            className={`px-2 py-1.5 text-sm rounded border min-h-[32px] flex items-center gap-1 transition-colors ${
                        bulkUpdate 
                ? 'cursor-default opacity-50 border-transparent' 
                : original && variant.stock !== original.stock
                ? 'cursor-text hover:bg-blue-50 border-blue-200 bg-blue-50/50'
                : 'cursor-text hover:bg-slate-50 border-transparent'
                      }`}
            title={original && variant.stock !== original.stock ? `Gốc: ${original.stock ?? 0} → Mới: ${variant.stock ?? 0}` : undefined}
                    >
                      {variant.stock !== undefined ? variant.stock : <span className="text-slate-400">Click để nhập</span>}
            {original && variant.stock !== original.stock && (
              <Check className="h-3 w-3 text-blue-600 flex-shrink-0" />
            )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
  );
}, (prevProps, nextProps) => {
  // PHASE 2: VariantQuickEditTable Performance (7.7.1) - Custom comparison để prevent unnecessary re-renders
  // Chỉ re-render nếu variant data hoặc editing state thay đổi
  return (
    prevProps.variant.id === nextProps.variant.id &&
    prevProps.variant.sku === nextProps.variant.sku &&
    prevProps.variant.price === nextProps.variant.price &&
    prevProps.variant.stock === nextProps.variant.stock &&
    prevProps.isEdited === nextProps.isEdited &&
    prevProps.isEditing(prevProps.variant.id, 'sku') === nextProps.isEditing(nextProps.variant.id, 'sku') &&
    prevProps.isEditing(prevProps.variant.id, 'price') === nextProps.isEditing(nextProps.variant.id, 'price') &&
    prevProps.isEditing(prevProps.variant.id, 'stock') === nextProps.isEditing(nextProps.variant.id, 'stock') &&
    prevProps.bulkUpdate === nextProps.bulkUpdate &&
    prevProps.editValue === nextProps.editValue
  );
});

VariantRow.displayName = 'VariantRow';

