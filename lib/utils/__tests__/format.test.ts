/**
 * Unit tests for format utility functions
 * Run with: npm test -- format.test.ts
 */

import { formatPrice } from '../format';

describe('Format Utilities', () => {
  describe('formatPrice', () => {
    it('should format valid prices', () => {
      expect(formatPrice('100000')).toBe('100.000 ₫');
      expect(formatPrice('50000')).toBe('50.000 ₫');
      expect(formatPrice('1500000')).toBe('1.500.000 ₫');
    });

    it('should handle prices that may have been divided by 1000', () => {
      // WPGraphQL có thể trả về giá đã bị chia cho 1000
      // Nếu giá < 1000, tự động nhân 1000
      expect(formatPrice('500')).toBe('500.000 ₫');
      expect(formatPrice(500)).toBe('500.000 ₫');
      expect(formatPrice('50')).toBe('50.000 ₫');
    });

    it('should handle prices with formatting (dots, commas)', () => {
      expect(formatPrice('500.000')).toBe('500.000 ₫');
      expect(formatPrice('1.500.000')).toBe('1.500.000 ₫');
      expect(formatPrice('500,000')).toBe('500.000 ₫');
    });

    it('should return "Liên hệ" for null/undefined prices', () => {
      expect(formatPrice(null)).toBe('Liên hệ');
      expect(formatPrice(undefined as any)).toBe('Liên hệ');
    });

    it('should handle empty string', () => {
      expect(formatPrice('')).toBe('Liên hệ');
    });

    it('should handle zero price', () => {
      expect(formatPrice('0')).toBe('0 ₫');
    });

    it('should handle prices with decimals', () => {
      expect(formatPrice('100000.50')).toBe('100.000 ₫');
    });
  });
});

