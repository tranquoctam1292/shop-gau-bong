'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AttributeValueSelectionModal } from './AttributeValueSelectionModal';

// Term interface - matches API response
export interface Term {
  id: string;
  name: string;
  slug: string;
  colorHex?: string;
  colorHex2?: string;
  imageUrl?: string;
  imageId?: string;
  description?: string;
  attributeId?: string;
  sortOrder?: number;
}

interface SmartValueInputProps {
  terms: Term[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  attributeType: 'text' | 'color' | 'image' | 'button';
  loading?: boolean;
  onQuickAdd?: () => void;
  placeholder?: string;
  attributeName?: string; // For modal title
}

export function SmartValueInput({
  terms,
  selectedValues,
  onValuesChange,
  attributeType,
  loading = false,
  onQuickAdd,
  placeholder = 'Chọn giá trị...',
  attributeName = 'Giá trị',
}: SmartValueInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle input click - open modal instead of dropdown
  const handleInputClick = () => {
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  // Filter terms based on search
  const filteredTerms = terms.filter((term) =>
    term.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter((v) => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    const allValues = filteredTerms.map((term) => term.name);
    const newValues = [...new Set([...selectedValues, ...allValues])];
    onValuesChange(newValues);
  };

  const handleDeselectAll = () => {
    const filteredValues = selectedValues.filter(
      (value) => !filteredTerms.some((term) => term.name === value)
    );
    onValuesChange(filteredValues);
  };

  const displayText =
    selectedValues.length > 0
      ? `${selectedValues.length} giá trị đã chọn`
      : placeholder;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Input Field - Opens Modal */}
        <div className="relative">
          <Input
            type="text"
            value={displayText}
            readOnly
            onClick={handleInputClick}
            className="cursor-pointer pr-10"
            placeholder={placeholder}
          />
          <ChevronDown
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform',
              isModalOpen && 'rotate-180'
            )}
          />
        </div>

        {/* Legacy Dropdown (kept for fallback, but modal is primary) */}
        {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-input rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm giá trị..."
              className="h-9"
              autoFocus
            />
          </div>

          {/* Actions Bar */}
          <div className="px-2 py-1.5 border-b flex items-center justify-between gap-2">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 text-xs"
              >
                Chọn tất cả
              </Button>
              {selectedValues.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="h-7 text-xs"
                >
                  Bỏ chọn
                </Button>
              )}
            </div>
            {onQuickAdd && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onQuickAdd}
                className="h-7 text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Tạo giá trị mới
              </Button>
            )}
          </div>

          {/* Terms List */}
          <div className="overflow-y-auto max-h-60">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTerms.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'Không tìm thấy giá trị nào' : 'Chưa có giá trị nào'}
              </div>
            ) : (
              <div className="p-1">
                {filteredTerms.map((term) => {
                  const isSelected = selectedValues.includes(term.name);

                  return (
                    <div
                      key={term.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer transition-colors',
                        isSelected && 'bg-primary/10'
                      )}
                      onClick={() => handleToggleValue(term.name)}
                    >
                      {/* Visual Preview */}
                      <div className="flex-shrink-0">
                        {attributeType === 'color' && term.colorHex && (
                          <div
                            className="w-8 h-8 rounded-full border-2 border-gray-300"
                            style={{
                              background: term.colorHex2
                                ? `linear-gradient(135deg, ${term.colorHex} 0%, ${term.colorHex2} 100%)`
                                : term.colorHex,
                            }}
                            title={term.name}
                          />
                        )}
                        {(attributeType === 'image' || attributeType === 'button') &&
                          term.imageUrl && (
                            <div className="w-8 h-8 border rounded overflow-hidden">
                              <img
                                src={term.imageUrl}
                                alt={term.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        {attributeType === 'text' && (
                          <div className="w-8 h-8 rounded border-2 border-gray-200 flex items-center justify-center text-xs text-muted-foreground">
                            T
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{term.name}</div>
                        {term.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {term.description}
                          </div>
                        )}
                      </div>

                      {/* Checkbox */}
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Modal for Value Selection */}
      <AttributeValueSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={(values) => {
          onValuesChange(values);
          setIsModalOpen(false);
        }}
        attributeName={attributeName}
        attributeType={attributeType}
        terms={terms as any}
        selectedValues={selectedValues}
        loading={loading}
        onQuickAdd={onQuickAdd}
      />
    </>
  );
}
