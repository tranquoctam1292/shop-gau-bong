'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Loader2, Plus, Minus } from 'lucide-react';
import { useQuickUpdateProduct } from '@/lib/hooks/useQuickUpdateProduct';

interface InlineStockEditorProps {
  productId: string;
  currentStock: number | null;
  onSave?: (newStock: number) => void;
  onCancel?: () => void;
}

export function InlineStockEditor({
  productId,
  currentStock,
  onSave,
  onCancel,
}: InlineStockEditorProps) {
  const [value, setValue] = useState(() => {
    return currentStock !== null && currentStock !== undefined ? currentStock.toString() : '0';
  });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { quickUpdate, isLoading } = useQuickUpdateProduct({
    onSuccess: (updatedProduct) => {
      const newStock = updatedProduct.stockQuantity ?? 0;
      onSave?.(newStock);
    },
  });

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setValue(inputValue);
    setError(null);

    // Validate: only allow integers
    if (inputValue && !/^\d+$/.test(inputValue)) {
      setError('Vui lòng nhập số nguyên hợp lệ');
      return;
    }

    // Validate: stockQuantity >= 0
    const numValue = parseInt(inputValue, 10);
    if (inputValue && (isNaN(numValue) || numValue < 0)) {
      setError('Số lượng phải lớn hơn hoặc bằng 0');
      return;
    }
  };

  const handleIncrement = () => {
    const numValue = parseInt(value, 10) || 0;
    setValue(String(numValue + 1));
    setError(null);
  };

  const handleDecrement = () => {
    const numValue = parseInt(value, 10) || 0;
    if (numValue > 0) {
      setValue(String(numValue - 1));
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!value || value.trim() === '') {
      setError('Vui lòng nhập số lượng');
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      setError('Số lượng phải lớn hơn hoặc bằng 0');
      return;
    }

    // If stock hasn't changed, just cancel
    const currentNumStock = currentStock ?? 0;
    if (numValue === currentNumStock) {
      onCancel?.();
      return;
    }

    await quickUpdate(productId, { stockQuantity: numValue });
  };

  const handleCancel = () => {
    setValue(currentStock !== null && currentStock !== undefined ? currentStock.toString() : '0');
    setError(null);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDecrement}
            disabled={isLoading || parseInt(value, 10) <= 0}
            className="h-8 w-8 p-0"
            title="Giảm"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input
            ref={inputRef}
            type="number"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập số lượng"
            min="0"
            className={`h-8 text-sm text-center ${error ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleIncrement}
            disabled={isLoading}
            className="h-8 w-8 p-0"
            title="Tăng"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading || !!error || !value}
          className="h-8 w-8 p-0"
          title="Lưu"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4 text-green-600" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-8 w-8 p-0"
          title="Hủy"
        >
          <X className="w-4 h-4 text-gray-400" />
        </Button>
      </div>
    </div>
  );
}

