'use client';

import { useState, useMemo } from 'react';
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
import { Loader2, Palette, Ruler, Image as ImageIcon, Tag } from 'lucide-react';
import type { Attribute } from '@/app/admin/attributes/page';
import type { Term } from '@/app/admin/attributes/[id]/terms/page';

interface AttributeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedAttributeIds: string[]) => void;
  attributes: Attribute[];
  loading: boolean;
  selectedAttributeIds?: string[];
  // Optional: terms data for preview
  termsMap?: Record<string, Term[]>;
}

const typeIcons: Record<Attribute['type'], typeof Palette> = {
  text: Tag,
  color: Palette,
  image: ImageIcon,
  button: Ruler,
};

const typeLabels: Record<Attribute['type'], string> = {
  text: 'Văn bản',
  color: 'Màu sắc',
  image: 'Hình ảnh',
  button: 'Nút bấm',
};

/**
 * Preview component for attribute values
 */
function AttributePreview({ 
  attribute, 
  terms 
}: { 
  attribute: Attribute; 
  terms?: Term[] 
}) {
  if (!terms || terms.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">Chưa có giá trị</span>
    );
  }

  // Show first 3-5 terms as preview
  const previewTerms = terms.slice(0, 5);

  if (attribute.type === 'color') {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {previewTerms.map((term) => (
          <div
            key={term.id}
            className="w-6 h-6 rounded-full border border-gray-300 shadow-sm"
            style={{
              backgroundColor: term.colorHex || '#ccc',
              backgroundImage: term.colorHex2
                ? `linear-gradient(135deg, ${term.colorHex} 0%, ${term.colorHex2} 100%)`
                : undefined,
            }}
            title={term.name}
          />
        ))}
        {terms.length > 5 && (
          <span className="text-xs text-muted-foreground">+{terms.length - 5}</span>
        )}
      </div>
    );
  }

  if (attribute.type === 'image' || attribute.type === 'button') {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {previewTerms.map((term) => (
          <div
            key={term.id}
            className="w-6 h-6 rounded border border-gray-300 overflow-hidden bg-gray-100"
            title={term.name}
          >
            {term.imageUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={term.imageUrl}
                  alt={term.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 150px"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">
                {term.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {terms.length > 5 && (
          <span className="text-xs text-muted-foreground">+{terms.length - 5}</span>
        )}
      </div>
    );
  }

  // Text type - show names
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {previewTerms.map((term, idx) => (
        <span
          key={term.id}
          className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-700"
        >
          {term.name}
        </span>
      ))}
      {terms.length > 5 && (
        <span className="text-xs text-muted-foreground">+{terms.length - 5}</span>
      )}
    </div>
  );
}

export function AttributeLibraryModal({
  isOpen,
  onClose,
  onApply,
  attributes,
  loading,
  selectedAttributeIds = [],
  termsMap = {},
}: AttributeLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedAttributeIds)
  );

  // Filter attributes based on search
  const filteredAttributes = useMemo(() => {
    if (!searchQuery.trim()) {
      return attributes;
    }
    const query = searchQuery.toLowerCase();
    return attributes.filter(
      (attr) =>
        attr.name.toLowerCase().includes(query) ||
        typeLabels[attr.type].toLowerCase().includes(query)
    );
  }, [attributes, searchQuery]);

  // Toggle selection
  const toggleSelection = (attributeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(attributeId)) {
        next.delete(attributeId);
      } else {
        next.add(attributeId);
      }
      return next;
    });
  };

  // Handle apply
  const handleApply = () => {
    onApply(Array.from(selectedIds));
    onClose();
  };

  // Reset selection when modal closes
  const handleClose = () => {
    setSelectedIds(new Set(selectedAttributeIds));
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Chọn thuộc tính sản phẩm</DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="py-4">
          <Input
            type="text"
            placeholder="Tìm kiếm thuộc tính (ví dụ: Màu, Kích thước...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAttributes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">
                {searchQuery ? 'Không tìm thấy thuộc tính nào' : 'Chưa có thuộc tính global nào'}
              </p>
              {!searchQuery && (
                <p className="text-xs mt-1">
                  Vào <strong>Sản phẩm &gt; Các thuộc tính</strong> để tạo thuộc tính mới.
                </p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        filteredAttributes.length > 0 &&
                        filteredAttributes.every((attr) => selectedIds.has(attr.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(
                            new Set([
                              ...selectedIds,
                              ...filteredAttributes.map((attr) => attr.id),
                            ])
                          );
                        } else {
                          setSelectedIds(
                            new Set(
                              Array.from(selectedIds).filter(
                                (id) => !filteredAttributes.some((attr) => attr.id === id)
                              )
                            )
                          );
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tên</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Loại</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Preview</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttributes.map((attribute) => {
                  const Icon = typeIcons[attribute.type];
                  const isSelected = selectedIds.has(attribute.id);
                  const terms = termsMap[attribute.id] || [];

                  return (
                    <tr
                      key={attribute.id}
                      className={`border-b hover:bg-muted/50 transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(attribute.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded ${
                              attribute.type === 'color'
                                ? 'bg-pink-100 text-pink-700'
                                : attribute.type === 'image'
                                ? 'bg-blue-100 text-blue-700'
                                : attribute.type === 'button'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{attribute.name}</div>
                            {attribute.termsCount !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                {attribute.termsCount} giá trị
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {typeLabels[attribute.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <AttributePreview attribute={attribute} terms={terms} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Đã chọn: <strong>{selectedIds.size}</strong> thuộc tính
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button onClick={handleApply} disabled={selectedIds.size === 0}>
              Áp dụng ({selectedIds.size})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
