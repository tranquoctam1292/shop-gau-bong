'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Term } from '@/app/admin/attributes/[id]/terms/page';

/**
 * Parse size value to centimeters for comparison
 * Examples: "25cm" -> 25, "1m" -> 100, "1m5" -> 150, "2m" -> 200
 */
function parseSizeToCm(value: string): number {
  const normalized = value.trim().toLowerCase();
  
  // Match patterns like "25cm", "1m", "1m5", "2m", etc.
  const cmMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*cm$/);
  if (cmMatch) {
    return parseFloat(cmMatch[1]);
  }
  
  const mMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*m(?:\s*(\d+(?:\.\d+)?))?$/);
  if (mMatch) {
    const meters = parseFloat(mMatch[1]);
    const additionalCm = mMatch[2] ? parseFloat(mMatch[2]) : 0;
    return meters * 100 + additionalCm;
  }
  
  // If can't parse, return a large number to push to end
  return Infinity;
}

/**
 * Check if attribute is a size attribute
 */
function isSizeAttribute(attributeName: string, attributeType: string): boolean {
  const nameLower = attributeName.toLowerCase();
  return (
    nameLower.includes('kích thước') ||
    nameLower.includes('size') ||
    nameLower.includes('kích cỡ') ||
    attributeType === 'button' // Button type is often used for sizes
  );
}

interface AttributeValueSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedValues: string[]) => void;
  attributeName: string;
  attributeType: 'text' | 'color' | 'image' | 'button';
  terms: Term[];
  selectedValues: string[]; // Pre-selected values
  loading?: boolean;
  onQuickAdd?: () => void;
}

/**
 * Color Swatch Item Component
 */
function ColorSwatchItem({
  term,
  isSelected,
  onToggle,
}: {
  term: Term;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-md',
        isSelected ? 'border-primary shadow-md scale-105' : 'border-gray-200'
      )}
      onClick={onToggle}
    >
      {/* Color Swatch */}
      <div
        className="w-full aspect-square rounded-t-lg"
        style={{
          background: term.colorHex2
            ? `linear-gradient(135deg, ${term.colorHex} 0%, ${term.colorHex2} 100%)`
            : term.colorHex || '#ccc',
          border: !term.colorHex || term.colorHex === '#FFFFFF' ? '1px solid #ddd' : 'none',
        }}
      >
        {/* Check Icon Overlay */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-t-lg">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>
      {/* Label */}
      <div className="p-2 text-center">
        <div className="text-sm font-medium truncate">{term.name}</div>
        {term.description && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {term.description}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Visual Table Row Component (for Image/Button types)
 */
function VisualTableRow({
  term,
  isSelected,
  onToggle,
}: {
  term: Term;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <tr
      className={cn(
        'border-b hover:bg-muted/50 transition-colors cursor-pointer',
        isSelected && 'bg-primary/5'
      )}
      onClick={onToggle}
    >
      <td className="px-4 py-3 w-12">
        <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      </td>
      <td className="px-4 py-3 w-24">
        {term.imageUrl ? (
          <div className="relative w-16 h-16 border rounded overflow-hidden bg-gray-100">
            <Image
              src={term.imageUrl}
              alt={term.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        ) : (
          <div className="w-16 h-16 border rounded bg-gray-100 flex items-center justify-center text-xs text-muted-foreground">
            {term.name.charAt(0).toUpperCase()}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-sm">{term.name}</div>
        {term.slug && (
          <div className="text-xs text-muted-foreground mt-0.5">{term.slug}</div>
        )}
      </td>
      <td className="px-4 py-3">
        {term.description ? (
          <div className="text-sm text-muted-foreground">{term.description}</div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

/**
 * Text List Item Component
 */
function TextListItem({
  term,
  isSelected,
  onToggle,
}: {
  term: Term;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted',
        isSelected && 'bg-primary/10 border-primary'
      )}
      onClick={onToggle}
    >
      <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{term.name}</div>
        {term.description && (
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {term.description}
          </div>
        )}
      </div>
      {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
    </div>
  );
}

export function AttributeValueSelectionModal({
  isOpen,
  onClose,
  onApply,
  attributeName,
  attributeType,
  terms,
  selectedValues,
  loading = false,
  onQuickAdd,
}: AttributeValueSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Initialize selectedIds from selectedValues (pre-select)
  useEffect(() => {
    if (isOpen) {
      const initialSelected = new Set<string>();
      terms.forEach((term) => {
        if (selectedValues.includes(term.name)) {
          initialSelected.add(term.id);
        }
      });
      setSelectedIds(initialSelected);
      setSearchQuery(''); // Reset search when modal opens
    }
  }, [isOpen, terms, selectedValues]);

  // Filter and sort terms
  const filteredTerms = useMemo(() => {
    let filtered = terms;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = terms.filter(
        (term) =>
          term.name.toLowerCase().includes(query) ||
          term.slug?.toLowerCase().includes(query) ||
          term.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort by size if this is a size attribute
    if (isSizeAttribute(attributeName, attributeType)) {
      filtered = [...filtered].sort((a, b) => {
        const sizeA = parseSizeToCm(a.name);
        const sizeB = parseSizeToCm(b.name);
        
        // If both are valid sizes, sort by size
        if (sizeA !== Infinity && sizeB !== Infinity) {
          return sizeA - sizeB;
        }
        
        // If only one is valid, put valid one first
        if (sizeA !== Infinity) return -1;
        if (sizeB !== Infinity) return 1;
        
        // If neither is valid, sort alphabetically
        return a.name.localeCompare(b.name);
      });
    }
    
    return filtered;
  }, [terms, searchQuery, attributeName, attributeType]);

  // Toggle selection
  const toggleSelection = (termId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(termId)) {
        next.delete(termId);
      } else {
        next.add(termId);
      }
      return next;
    });
  };

  // Select All / Deselect All
  const handleSelectAll = () => {
    const allFilteredIds = new Set(filteredTerms.map((term) => term.id));
    setSelectedIds((prev) => new Set([...prev, ...allFilteredIds]));
  };

  const handleDeselectAll = () => {
    const filteredIds = new Set(filteredTerms.map((term) => term.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  // Handle Apply
  const handleApply = () => {
    const selectedTermNames = terms
      .filter((term) => selectedIds.has(term.id))
      .map((term) => term.name);
    onApply(selectedTermNames);
    onClose();
  };

  // Handle Close
  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const selectedCount = selectedIds.size;
  const allFilteredSelected = filteredTerms.length > 0 && 
    filteredTerms.every((term) => selectedIds.has(term.id));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Chọn {attributeName}
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="space-y-3 py-4 border-b">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={`Tìm kiếm ${attributeName.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={allFilteredSelected ? handleDeselectAll : handleSelectAll}
              >
                {allFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
              {onQuickAdd && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onQuickAdd}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Thêm nhanh
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredTerms.length} giá trị
            </div>
          </div>
        </div>

        {/* Body - Different layouts based on attribute type */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">
                {searchQuery ? 'Không tìm thấy giá trị nào' : 'Chưa có giá trị nào'}
              </p>
              {!searchQuery && onQuickAdd && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onQuickAdd}
                  className="mt-4 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Thêm giá trị đầu tiên
                </Button>
              )}
            </div>
          ) : attributeType === 'color' ? (
            // Color Mode: Grid Layout
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 p-4">
              {filteredTerms.map((term) => (
                <ColorSwatchItem
                  key={term.id}
                  term={term}
                  isSelected={selectedIds.has(term.id)}
                  onToggle={() => toggleSelection(term.id)}
                />
              ))}
            </div>
          ) : attributeType === 'image' || attributeType === 'button' ? (
            // Visual Mode: Table Layout
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={allFilteredSelected ? handleDeselectAll : handleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Hình ảnh</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tên</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTerms.map((term) => (
                    <VisualTableRow
                      key={term.id}
                      term={term}
                      isSelected={selectedIds.has(term.id)}
                      onToggle={() => toggleSelection(term.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Text Mode: List Layout
            <div className="p-4 space-y-2">
              {filteredTerms.map((term) => (
                <TextListItem
                  key={term.id}
                  term={term}
                  isSelected={selectedIds.has(term.id)}
                  onToggle={() => toggleSelection(term.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Đã chọn: <strong>{selectedCount}</strong> giá trị
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button onClick={handleApply} disabled={selectedCount === 0}>
              Áp dụng ({selectedCount})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
