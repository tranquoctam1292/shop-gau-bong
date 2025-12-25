'use client';

import { Input } from '@/components/ui/input';
import { forwardRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PriceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  showCurrency?: boolean;
  showClearButton?: boolean; // PHASE 3: Empty/Null Values (7.10.1) - Show clear button
  placeholder?: string; // PHASE 3: Empty/Null Values (7.10.1) - Custom placeholder
}

/**
 * PriceInput Component
 * Formats number with thousand separators (10.000.000) while typing
 * Stores actual number value (without formatting)
 */
export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onChange, showCurrency = true, showClearButton = false, placeholder = 'Nhập giá...', className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>('');

    // Update display value when value prop changes
    useEffect(() => {
      if (value === undefined || value === null || isNaN(value) || value === 0) {
        setDisplayValue('');
      } else {
        // Format with thousand separators
        const formatted = new Intl.NumberFormat('vi-VN').format(value);
        setDisplayValue(formatted);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove all non-digit characters (keep only numbers)
      const numericValue = inputValue.replace(/[^\d]/g, '');
      
      // Update display with formatting
      if (numericValue === '') {
        setDisplayValue('');
        onChange?.(undefined);
      } else {
        const num = parseInt(numericValue, 10);
        if (!isNaN(num)) {
          // Format with thousand separators for display
          const formatted = new Intl.NumberFormat('vi-VN').format(num);
          setDisplayValue(formatted);
          // Pass numeric value to onChange
          onChange?.(num);
        }
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // On blur, ensure display value matches the numeric value
      if (value !== undefined && value !== null && !isNaN(value)) {
        const formatted = new Intl.NumberFormat('vi-VN').format(value);
        setDisplayValue(formatted);
      }
    };

    const handleClear = () => {
      setDisplayValue('');
      onChange?.(undefined);
    };

    const hasValue = value !== undefined && value !== null && !isNaN(value) && value !== 0;

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={showCurrency || showClearButton 
            ? `${className || ''} ${showCurrency && showClearButton ? 'pr-24' : showCurrency ? 'pr-20' : showClearButton ? 'pr-10' : ''}` 
            : className}
        />
        {/* PHASE 3: Empty/Null Values (7.10.1) - Clear button */}
        {showClearButton && hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-950 rounded p-1"
            aria-label="Xóa giá"
            tabIndex={-1}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {showCurrency && (
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none ${showClearButton && hasValue ? 'right-10' : ''}`}>
            đ
          </span>
        )}
      </div>
    );
  }
);

PriceInput.displayName = 'PriceInput';
