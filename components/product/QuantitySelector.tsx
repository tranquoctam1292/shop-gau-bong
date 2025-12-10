'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: QuantitySelectorProps) {
  // Local state để cho phép input trống tạm thời khi người dùng đang nhập
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  // Sync local state với prop value khi không focus
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  const handleDecrease = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Cho phép input trống tạm thời (để người dùng có thể xóa và nhập lại)
    if (rawValue === '') {
      setInputValue('');
      return;
    }

    // Chỉ parse và validate khi có giá trị
    const numValue = parseInt(rawValue, 10);
    
    // Nếu không phải số hợp lệ, giữ nguyên giá trị hiện tại
    if (isNaN(numValue)) {
      return;
    }

    // Cập nhật local state để hiển thị
    setInputValue(rawValue);

    // Validate và update parent chỉ khi giá trị hợp lệ
    if (numValue >= min && numValue <= max) {
      onChange(numValue);
    }
    // Nếu vượt quá max, vẫn cho phép hiển thị nhưng không update parent
    // (sẽ được validate lại khi blur)
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseInt(inputValue, 10);
    
    // Nếu input trống hoặc không hợp lệ, set về giá trị hiện tại
    if (isNaN(numValue) || inputValue === '') {
      setInputValue(value.toString());
      return;
    }

    // Validate và clamp giá trị
    let finalValue = numValue;
    if (numValue < min) {
      finalValue = min;
    } else if (numValue > max) {
      finalValue = max;
    }

    // Update parent và local state
    onChange(finalValue);
    setInputValue(finalValue.toString());
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const isDecreaseDisabled = disabled || value <= min;
  const isIncreaseDisabled = disabled || value >= max;

  return (
    <div className="flex items-center justify-between w-[110px] md:w-[120px] h-8 md:h-9 min-h-[44px] border-2 border-pink-300 rounded-full bg-white px-1 box-border">
      {/* Decrease Button */}
      <button
        type="button"
        onClick={handleDecrease}
        disabled={isDecreaseDisabled}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full",
          "text-pink-500 font-bold text-lg transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
          "hover:bg-pink-50 active:bg-pink-100",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
          "pb-0.5" // Căn chỉnh dấu - cho cân giữa
        )}
        aria-label="Giảm số lượng"
        aria-disabled={isDecreaseDisabled}
      >
        −
      </button>

      {/* Input */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        role="spinbutton"
        className={cn(
          "w-10 md:w-12 h-full border-none bg-transparent text-center",
          "text-sm md:text-base font-bold text-gray-800",
          "focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        )}
        aria-label="Số lượng"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />

      {/* Increase Button */}
      <button
        type="button"
        onClick={handleIncrease}
        disabled={isIncreaseDisabled}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full",
          "text-pink-500 font-bold text-lg transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2",
          "hover:bg-pink-50 active:bg-pink-100",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
          "pb-0.5" // Căn chỉnh dấu + cho cân giữa
        )}
        aria-label="Tăng số lượng"
        aria-disabled={isIncreaseDisabled}
      >
        +
      </button>
    </div>
  );
}

