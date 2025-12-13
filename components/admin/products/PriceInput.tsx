'use client';

import { Input } from '@/components/ui/input';
import { forwardRef, useState, useEffect } from 'react';

interface PriceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  showCurrency?: boolean;
}

/**
 * PriceInput Component
 * Formats number with thousand separators (10.000.000) while typing
 * Stores actual number value (without formatting)
 */
export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onChange, showCurrency = true, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>('');

    // Update display value when value prop changes
    useEffect(() => {
      if (value === undefined || value === null || isNaN(value)) {
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
          className={showCurrency ? `${className || ''} pr-20` : className}
        />
        {showCurrency && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            đ
          </span>
        )}
      </div>
    );
  }
);

PriceInput.displayName = 'PriceInput';
