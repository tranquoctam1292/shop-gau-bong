'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface PriceRangeFilterProps {
  minPrice: number | null;
  maxPrice: number | null;
  onMinPriceChange: (value: number | null) => void;
  onMaxPriceChange: (value: number | null) => void;
  onClear: () => void;
}

export function PriceRangeFilter({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
}: PriceRangeFilterProps) {
  const [minValue, setMinValue] = useState(minPrice?.toString() || '');
  const [maxValue, setMaxValue] = useState(maxPrice?.toString() || '');
  const [error, setError] = useState<string | null>(null);

  // Sync with props
  useEffect(() => {
    setMinValue(minPrice?.toString() || '');
    setMaxValue(maxPrice?.toString() || '');
  }, [minPrice, maxPrice]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinValue(value);
    setError(null);

    if (!value || value.trim() === '') {
      onMinPriceChange(null);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setError('Giá tối thiểu phải là số >= 0');
      return;
    }

    if (maxPrice !== null && numValue > maxPrice) {
      setError('Giá tối thiểu không được lớn hơn giá tối đa');
      return;
    }

    onMinPriceChange(numValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxValue(value);
    setError(null);

    if (!value || value.trim() === '') {
      onMaxPriceChange(null);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setError('Giá tối đa phải là số >= 0');
      return;
    }

    if (minPrice !== null && numValue < minPrice) {
      setError('Giá tối đa không được nhỏ hơn giá tối thiểu');
      return;
    }

    onMaxPriceChange(numValue);
  };

  const hasValue = minPrice !== null || maxPrice !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Khoảng giá (VND)</Label>
        {hasValue && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Xóa
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="number"
            placeholder="Tối thiểu"
            value={minValue}
            onChange={handleMinChange}
            min="0"
            className="text-sm"
          />
        </div>
        <span className="text-gray-400">-</span>
        <div className="flex-1">
          <Input
            type="number"
            placeholder="Tối đa"
            value={maxValue}
            onChange={handleMaxChange}
            min="0"
            className="text-sm"
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {hasValue && !error && (
        <p className="text-xs text-gray-500">
          {minPrice !== null && maxPrice !== null
            ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
            : minPrice !== null
            ? `Từ ${formatPrice(minPrice)}`
            : `Đến ${formatPrice(maxPrice!)}`}
        </p>
      )}
    </div>
  );
}

