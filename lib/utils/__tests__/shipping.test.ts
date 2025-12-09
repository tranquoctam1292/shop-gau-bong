/**
 * Unit tests for shipping utility functions
 * Run with: npm test -- shipping.test.ts
 */

import {
  calculateVolumetricWeight,
  getShippingWeight,
  calculateTotalShippingWeight,
} from '../shipping';

describe('Shipping Utilities', () => {
  describe('calculateVolumetricWeight', () => {
    it('should calculate volumetric weight correctly', () => {
      const result = calculateVolumetricWeight(30, 20, 15);
      // (30 * 20 * 15) / 6000 = 9000 / 6000 = 1.5
      expect(result).toBe(1.5);
    });

    it('should return 0 if any dimension is 0', () => {
      expect(calculateVolumetricWeight(0, 20, 15)).toBe(0);
      expect(calculateVolumetricWeight(30, 0, 15)).toBe(0);
      expect(calculateVolumetricWeight(30, 20, 0)).toBe(0);
    });

    it('should handle null/undefined dimensions', () => {
      expect(calculateVolumetricWeight(null as any, 20, 15)).toBe(0);
      expect(calculateVolumetricWeight(30, undefined as any, 15)).toBe(0);
      expect(calculateVolumetricWeight(30, 20, null as any)).toBe(0);
    });

    it('should handle string numbers', () => {
      expect(calculateVolumetricWeight('30' as any, '20' as any, '15' as any)).toBe(1.5);
    });

    it('should round to 2 decimal places', () => {
      const result = calculateVolumetricWeight(25, 17, 13);
      // (25 * 17 * 13) / 6000 = 5525 / 6000 = 0.920833...
      expect(result).toBeCloseTo(0.92, 2);
    });
  });

  describe('getShippingWeight', () => {
    it('should return volumetric weight if greater than actual weight', () => {
      const result = getShippingWeight(0.5, 2.0); // actual: 0.5kg, volumetric: 2.0kg
      expect(result).toBe(2.0);
    });

    it('should return actual weight if greater than volumetric weight', () => {
      const result = getShippingWeight(3.0, 1.5); // actual: 3.0kg, volumetric: 1.5kg
      expect(result).toBe(3.0);
    });

    it('should return actual weight if volumetric weight is 0', () => {
      const result = getShippingWeight(2.0, 0);
      expect(result).toBe(2.0);
    });

    it('should return volumetric weight if actual weight is 0', () => {
      const result = getShippingWeight(0, 1.5);
      expect(result).toBe(1.5);
    });

    it('should return 0 if both weights are 0', () => {
      const result = getShippingWeight(0, 0);
      expect(result).toBe(0);
    });

    it('should handle null/undefined weights', () => {
      expect(getShippingWeight(null as any, 1.5)).toBe(1.5);
      expect(getShippingWeight(2.0, null as any)).toBe(2.0);
      expect(getShippingWeight(null as any, null as any)).toBe(0);
    });
  });

  describe('calculateTotalShippingWeight', () => {
    it('should calculate total weight for multiple items', () => {
      const items = [
        {
          quantity: 1,
          product: {
            weight: 0.5,
            productSpecs: {
              volumetricWeight: 1.0,
            },
          },
        },
        {
          quantity: 1,
          product: {
            weight: 1.0,
            productSpecs: {
              volumetricWeight: 0.8,
            },
          },
        },
        {
          quantity: 1,
          product: {
            weight: 0.3,
            productSpecs: {
              volumetricWeight: 1.2,
            },
          },
        },
      ];
      const result = calculateTotalShippingWeight(items);
      // Max(0.5, 1.0) + Max(1.0, 0.8) + Max(0.3, 1.2) = 1.0 + 1.0 + 1.2 = 3.2
      expect(result).toBe(3.2);
    });

    it('should handle empty array', () => {
      const result = calculateTotalShippingWeight([]);
      expect(result).toBe(0);
    });

    it('should handle items with missing weights', () => {
      const items = [
        {
          quantity: 1,
          product: {
            weight: 0.5,
            productSpecs: {
              volumetricWeight: null,
            },
          },
        },
        {
          quantity: 1,
          product: {
            weight: null,
            productSpecs: {
              volumetricWeight: 1.0,
            },
          },
        },
      ];
      const result = calculateTotalShippingWeight(items);
      // Max(0.5, 0) + Max(0, 1.0) = 0.5 + 1.0 = 1.5
      expect(result).toBe(1.5);
    });
  });
});

