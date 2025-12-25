/**
 * Type-Safe Conversion Helpers
 * 
 * PHASE 2: Type Mismatch Fix (7.8.1)
 * 
 * Helper functions để convert types giữa MappedProduct và form data
 * Đảm bảo type safety và xử lý edge cases (NaN, null, undefined, empty strings)
 */

/**
 * Parse price từ string hoặc number sang number
 * 
 * @param price - Price value (string | number | null | undefined)
 * @param defaultValue - Default value nếu không parse được (default: 0)
 * @returns Parsed number hoặc defaultValue
 * 
 * @example
 * parsePrice('100.5') // 100.5
 * parsePrice(100.5) // 100.5
 * parsePrice('') // 0
 * parsePrice(null) // 0
 * parsePrice(undefined) // 0
 * parsePrice('invalid') // 0
 */
export function parsePrice(
  price: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (price === null || price === undefined || price === '') {
    return defaultValue;
  }
  
  if (typeof price === 'number') {
    // Check for NaN or Infinity
    if (isNaN(price) || !isFinite(price)) {
      return defaultValue;
    }
    return price;
  }
  
  if (typeof price === 'string') {
    // Remove currency symbols and whitespace
    const cleaned = price.trim().replace(/[^\d.-]/g, '');
    if (cleaned === '' || cleaned === '-') {
      return defaultValue;
    }
    
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || !isFinite(parsed)) {
      return defaultValue;
    }
    
    return parsed;
  }
  
  return defaultValue;
}

/**
 * Parse price từ string hoặc number sang number (optional)
 * Returns undefined nếu không parse được thay vì defaultValue
 * 
 * @param price - Price value (string | number | null | undefined)
 * @returns Parsed number hoặc undefined
 * 
 * @example
 * parsePriceOptional('100.5') // 100.5
 * parsePriceOptional('') // undefined
 * parsePriceOptional(null) // undefined
 */
export function parsePriceOptional(
  price: string | number | null | undefined
): number | undefined {
  if (price === null || price === undefined || price === '') {
    return undefined;
  }
  
  if (typeof price === 'number') {
    if (isNaN(price) || !isFinite(price)) {
      return undefined;
    }
    return price;
  }
  
  if (typeof price === 'string') {
    const cleaned = price.trim().replace(/[^\d.-]/g, '');
    if (cleaned === '' || cleaned === '-') {
      return undefined;
    }
    
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || !isFinite(parsed)) {
      return undefined;
    }
    
    return parsed;
  }
  
  return undefined;
}

/**
 * Parse integer từ string hoặc number sang number
 * 
 * @param value - Integer value (string | number | null | undefined)
 * @param defaultValue - Default value nếu không parse được (default: 0)
 * @returns Parsed integer hoặc defaultValue
 * 
 * @example
 * parseInteger('100') // 100
 * parseInteger(100.5) // 100 (truncated)
 * parseInteger('') // 0
 */
export function parseInteger(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return defaultValue;
    }
    return Math.floor(value);
  }
  
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[^\d.-]/g, '');
    if (cleaned === '' || cleaned === '-') {
      return defaultValue;
    }
    
    const parsed = parseInt(cleaned, 10);
    if (isNaN(parsed) || !isFinite(parsed)) {
      return defaultValue;
    }
    
    return parsed;
  }
  
  return defaultValue;
}

/**
 * Parse integer từ string hoặc number sang number (optional)
 * Returns undefined nếu không parse được
 * 
 * @param value - Integer value (string | number | null | undefined)
 * @returns Parsed integer hoặc undefined
 */
export function parseIntegerOptional(
  value: string | number | null | undefined
): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return undefined;
    }
    return Math.floor(value);
  }
  
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[^\d.-]/g, '');
    if (cleaned === '' || cleaned === '-') {
      return undefined;
    }
    
    const parsed = parseInt(cleaned, 10);
    if (isNaN(parsed) || !isFinite(parsed)) {
      return undefined;
    }
    
    return parsed;
  }
  
  return undefined;
}

/**
 * Type guard để check nếu value là valid number
 * 
 * @param value - Value to check
 * @returns true nếu value là valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard để check nếu value là valid price (number >= 0)
 * 
 * @param value - Value to check
 * @returns true nếu value là valid price
 */
export function isValidPrice(value: unknown): value is number {
  return isValidNumber(value) && value >= 0;
}

/**
 * Type guard để check nếu value là valid integer (number >= 0)
 * 
 * @param value - Value to check
 * @returns true nếu value là valid integer
 */
export function isValidInteger(value: unknown): value is number {
  return isValidNumber(value) && value >= 0 && Number.isInteger(value);
}

/**
 * Convert number to string với formatting (optional)
 * 
 * @param value - Number value
 * @param options - Formatting options
 * @returns Formatted string
 * 
 * @example
 * formatNumber(1000.5) // "1000.5"
 * formatNumber(1000.5, { decimals: 2 }) // "1000.50"
 * formatNumber(1000.5, { thousandSeparator: true }) // "1,000.5"
 */
export function formatNumber(
  value: number | null | undefined,
  options: {
    decimals?: number;
    thousandSeparator?: boolean;
  } = {}
): string {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return '';
  }
  
  const { decimals, thousandSeparator } = options;
  
  let formatted = value.toString();
  
  if (decimals !== undefined) {
    formatted = value.toFixed(decimals);
  }
  
  if (thousandSeparator) {
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatted = parts.join('.');
  }
  
  return formatted;
}

