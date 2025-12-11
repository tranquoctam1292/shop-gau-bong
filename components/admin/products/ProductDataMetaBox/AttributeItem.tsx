'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Palette } from 'lucide-react';

export interface Attribute {
  id: string;
  name: string;
  isGlobal: boolean;
  values: string[];
  usedForVariations: boolean;
  colorCodes?: Record<string, string>; // For color attributes: value -> hex code
}

interface AttributeItemProps {
  attribute: Attribute;
  onUpdate: (updated: Attribute) => void;
  onRemove: () => void;
  existingValues?: string[]; // For auto-suggest
}

/**
 * Attribute Item Component
 * Features:
 * - Name field (read-only if global, editable if custom)
 * - Values input với Tags/Chips UI
 * - Auto-suggest từ existing values
 * - Color Picker cho color attributes
 * - Used for variations checkbox
 */
export function AttributeItem({
  attribute,
  onUpdate,
  onRemove,
  existingValues = [],
}: AttributeItemProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isColorAttribute = attribute.name.toLowerCase() === 'màu sắc' || 
                          attribute.name.toLowerCase() === 'color' ||
                          attribute.name.toLowerCase() === 'màu';

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() && existingValues.length > 0) {
      const filtered = existingValues
        .filter((val) => 
          val.toLowerCase().includes(inputValue.toLowerCase()) &&
          !attribute.values.includes(val)
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, existingValues, attribute.values]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddValue = (value: string, colorCode?: string) => {
    if (!value.trim() || attribute.values.includes(value.trim())) return;

    const newValues = [...attribute.values, value.trim()];
    const newColorCodes = colorCode
      ? { ...attribute.colorCodes, [value.trim()]: colorCode }
      : attribute.colorCodes;

    onUpdate({
      ...attribute,
      values: newValues,
      colorCodes: newColorCodes,
    });

    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveValue = (value: string) => {
    const newValues = attribute.values.filter((v) => v !== value);
    const newColorCodes = { ...attribute.colorCodes };
    delete newColorCodes[value];

    onUpdate({
      ...attribute,
      values: newValues,
      colorCodes: Object.keys(newColorCodes).length > 0 ? newColorCodes : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddValue(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      // Could implement keyboard navigation here
    }
  };

  const handleColorChange = (value: string, colorCode: string) => {
    handleAddValue(value, colorCode);
  };

  return (
    <div className="p-4 border border-input rounded-lg bg-background space-y-4">
      <div className="flex items-start justify-between gap-4">
        {/* Attribute Name */}
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium">Tên thuộc tính</Label>
          {attribute.isGlobal ? (
            <div className="px-3 py-2 bg-muted rounded border border-input text-sm">
              {attribute.name}
              <span className="ml-2 text-xs text-muted-foreground">(Global)</span>
            </div>
          ) : (
            <Input
              type="text"
              value={attribute.name}
              onChange={(e) => onUpdate({ ...attribute, name: e.target.value })}
              placeholder="VD: Kích thước, Màu sắc..."
              className="text-sm"
            />
          )}
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Values Input */}
      <div className="space-y-2" ref={containerRef}>
        <Label className="text-sm font-medium">Giá trị</Label>
        
        {isColorAttribute ? (
          // Color Picker Mode
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tên màu (VD: Đỏ, Xanh lá...)"
                className="flex-1 text-sm"
              />
              <Input
                type="color"
                onChange={(e) => {
                  const colorName = inputValue.trim() || `Màu ${e.target.value}`;
                  handleColorChange(colorName, e.target.value);
                }}
                className="w-16 h-10 cursor-pointer"
                title="Chọn màu"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (inputValue.trim()) {
                    // Use a default color if no color picker value
                    handleAddValue(inputValue);
                  }
                }}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Thêm
              </Button>
            </div>
          </div>
        ) : (
          // Text Input Mode
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Nhập giá trị và nhấn Enter..."
              className="text-sm"
            />
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAddValue(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Values Display (Tags/Chips) */}
        {attribute.values.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {attribute.values.map((value) => (
              <div
                key={value}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
              >
                {isColorAttribute && attribute.colorCodes?.[value] && (
                  <div
                    className="w-4 h-4 rounded border border-input"
                    style={{ backgroundColor: attribute.colorCodes[value] }}
                    title={attribute.colorCodes[value]}
                  />
                )}
                <span>{value}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveValue(value)}
                  className="ml-1 hover:text-destructive transition-colors"
                  aria-label="Xóa"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Used for Variations Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer group pt-2 border-t border-input">
        <Checkbox
          checked={attribute.usedForVariations}
          onCheckedChange={(checked) =>
            onUpdate({ ...attribute, usedForVariations: checked === true })
          }
        />
        <span className="text-sm text-foreground group-hover:text-primary transition-colors">
          Dùng cho nhiều biến thể
        </span>
        {attribute.usedForVariations && (
          <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
            ✓
          </span>
        )}
      </label>
      {attribute.usedForVariations && (
        <p className="text-xs text-muted-foreground ml-6">
          Thuộc tính này sẽ được sử dụng để tạo các biến thể sản phẩm
        </p>
      )}
    </div>
  );
}
