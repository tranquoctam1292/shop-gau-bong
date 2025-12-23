'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Loader2 } from 'lucide-react';
import { useQuickUpdateProduct } from '@/lib/hooks/useQuickUpdateProduct';

interface InlinePriceEditorProps {
  productId: string;
  currentPrice: string | number;
  onSave?: (newPrice: number) => void;
  onCancel?: () => void;
}

export function InlinePriceEditor({
  productId,
  currentPrice,
  onSave,
  onCancel,
}: InlinePriceEditorProps) {
  const [value, setValue] = useState(() => {
    // Convert price to number and remove currency formatting
    const numPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    return isNaN(numPrice) || numPrice <= 0 ? '' : numPrice.toString();
  });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { quickUpdate, isLoading } = useQuickUpdateProduct({
    onSuccess: (updatedProduct) => {
      const newPrice = parseFloat(updatedProduct.price);
      onSave?.(newPrice);
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

    // Validate: only allow numbers and decimal point
    if (inputValue && !/^\d*\.?\d*$/.test(inputValue)) {
      setError('Vui lòng nhập số hợp lệ');
      return;
    }

    // Validate: price >= 0
    const numValue = parseFloat(inputValue);
    if (inputValue && (isNaN(numValue) || numValue < 0)) {
      setError('Giá phải lớn hơn hoặc bằng 0');
      return;
    }
  };

  const handleSave = async () => {
    if (!value || value.trim() === '') {
      setError('Vui lòng nhập giá');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setError('Giá phải lớn hơn hoặc bằng 0');
      return;
    }

    // If price hasn't changed, just cancel
    const currentNumPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
    if (numValue === currentNumPrice) {
      onCancel?.();
      return;
    }

    await quickUpdate(productId, { price: numValue });
  };

  const handleCancel = () => {
    setValue(typeof currentPrice === 'string' ? parseFloat(currentPrice).toString() : currentPrice.toString());
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

  // Format display value with VND
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <div className="flex-1">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập giá (VND)"
          className={`h-8 text-sm ${error ? 'border-red-500' : ''}`}
          disabled={isLoading}
        />
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
        {value && !error && (
          <p className="text-xs text-gray-500 mt-1">
            {formatPrice(parseFloat(value))}
          </p>
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

