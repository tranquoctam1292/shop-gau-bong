/**
 * Date Utility Functions
 * 
 * Helper functions for safely converting dates to ISO strings
 * Handles both Date objects and ISO string inputs (from serialized data)
 */

/**
 * Safely convert a date value to ISO string
 * 
 * Handles:
 * - Date objects: calls toISOString()
 * - ISO strings: returns as-is
 * - null/undefined: returns fallback or null
 * 
 * @param date - Date object, ISO string, or null/undefined
 * @param fallback - Fallback ISO string if date is null/undefined (default: current date)
 * @returns ISO string representation of the date
 * 
 * @example
 * ```typescript
 * safeToISOString(new Date()) // "2024-01-01T00:00:00.000Z"
 * safeToISOString("2024-01-01T00:00:00.000Z") // "2024-01-01T00:00:00.000Z"
 * safeToISOString(null) // "2024-01-01T00:00:00.000Z" (current date)
 * safeToISOString(null, null) // null
 * ```
 */
export function safeToISOString(
  date: Date | string | null | undefined,
  fallback?: string | null
): string | null {
  // If date is null/undefined, return fallback
  if (date == null) {
    return fallback !== undefined ? fallback : new Date().toISOString();
  }
  
  // If already a string (ISO format), return as-is
  if (typeof date === 'string') {
    return date;
  }
  
  // If Date object, check if it's valid before calling toISOString
  if (date instanceof Date) {
    // Check if date is valid (not NaN)
    if (isNaN(date.getTime())) {
      // Invalid date, return fallback
      return fallback !== undefined ? fallback : new Date().toISOString();
    }
    return date.toISOString();
  }
  
  // Fallback for any other type
  return fallback !== undefined ? fallback : new Date().toISOString();
}

