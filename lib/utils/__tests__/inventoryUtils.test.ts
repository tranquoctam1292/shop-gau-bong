/**
 * Inventory Utils Unit Tests
 *
 * Tests for inventoryUtils functions
 *
 * Run with: npm test -- inventoryUtils.test.ts
 */

import {
  getManageStock,
  getProductStockQuantity,
  getProductReservedQuantity,
  getProductAvailableQuantity,
  getVariantStockQuantity,
  getVariantReservedQuantity,
  getVariantAvailableQuantity,
  getLowStockThreshold,
  isLowStock,
  isVariantLowStock,
  buildStockQuantityIncrement,
  buildVariantStockIncrement,
  calculateStockStatus,
  buildStockStatusUpdate,
  isOutOfStock,
  canReserveStock,
  validateStockQuantity,
} from '@/lib/utils/inventoryUtils';

describe('Inventory Utils', () => {
  // ============================================
  // getManageStock Tests
  // ============================================

  describe('getManageStock', () => {
    it('should return true when manageStock is true in productDataMetaBox', () => {
      const product = {
        productDataMetaBox: { manageStock: true },
      };
      expect(getManageStock(product)).toBe(true);
    });

    it('should return true when manageStock is true at root level', () => {
      const product = { manageStock: true };
      expect(getManageStock(product)).toBe(true);
    });

    it('should return false when manageStock is false', () => {
      const product = {
        productDataMetaBox: { manageStock: false },
        manageStock: false,
      };
      expect(getManageStock(product)).toBe(false);
    });

    it('should return false when manageStock is undefined', () => {
      const product = {};
      expect(getManageStock(product)).toBe(false);
    });

    it('should prioritize productDataMetaBox over root level', () => {
      const product = {
        productDataMetaBox: { manageStock: true },
        manageStock: false,
      };
      expect(getManageStock(product)).toBe(true);
    });
  });

  // ============================================
  // getProductStockQuantity Tests
  // ============================================

  describe('getProductStockQuantity', () => {
    it('should return stockQuantity from root level', () => {
      const product = { stockQuantity: 100 };
      expect(getProductStockQuantity(product)).toBe(100);
    });

    it('should return stockQuantity from productDataMetaBox', () => {
      const product = {
        productDataMetaBox: { stockQuantity: 50 },
      };
      expect(getProductStockQuantity(product)).toBe(50);
    });

    it('should prioritize productDataMetaBox over root level', () => {
      const product = {
        productDataMetaBox: { stockQuantity: 30 },
        stockQuantity: 100,
      };
      expect(getProductStockQuantity(product)).toBe(30);
    });

    it('should return 0 when no stockQuantity field exists', () => {
      const product = {};
      expect(getProductStockQuantity(product)).toBe(0);
    });

    it('should return 0 when stockQuantity is null', () => {
      const product = { stockQuantity: null };
      expect(getProductStockQuantity(product)).toBe(0);
    });
  });

  // ============================================
  // getProductReservedQuantity Tests
  // ============================================

  describe('getProductReservedQuantity', () => {
    it('should return reservedQuantity from root level', () => {
      const product = { reservedQuantity: 10 };
      expect(getProductReservedQuantity(product)).toBe(10);
    });

    it('should return 0 when no reservedQuantity exists', () => {
      const product = {};
      expect(getProductReservedQuantity(product)).toBe(0);
    });

    it('should return 0 when reservedQuantity is null', () => {
      const product = { reservedQuantity: null };
      expect(getProductReservedQuantity(product)).toBe(0);
    });
  });

  // ============================================
  // getProductAvailableQuantity Tests
  // ============================================

  describe('getProductAvailableQuantity', () => {
    it('should calculate available as stock - reserved', () => {
      const product = { stockQuantity: 100, reservedQuantity: 10 };
      expect(getProductAvailableQuantity(product)).toBe(90);
    });

    it('should return 0 when reserved >= stock', () => {
      const product = { stockQuantity: 10, reservedQuantity: 15 };
      expect(getProductAvailableQuantity(product)).toBe(0);
    });

    it('should handle missing reservedQuantity', () => {
      const product = { stockQuantity: 100 };
      expect(getProductAvailableQuantity(product)).toBe(100);
    });
  });

  // ============================================
  // getVariantStockQuantity Tests
  // ============================================

  describe('getVariantStockQuantity', () => {
    it('should return stockQuantity from variant', () => {
      const variant = { stockQuantity: 50 };
      expect(getVariantStockQuantity(variant)).toBe(50);
    });

    it('should return stock field as fallback', () => {
      const variant = { stock: 30 };
      expect(getVariantStockQuantity(variant)).toBe(30);
    });

    it('should prioritize stockQuantity over stock', () => {
      const variant = { stockQuantity: 50, stock: 30 };
      expect(getVariantStockQuantity(variant)).toBe(50);
    });

    it('should return 0 when no stock field exists', () => {
      const variant = {};
      expect(getVariantStockQuantity(variant)).toBe(0);
    });
  });

  // ============================================
  // getVariantReservedQuantity Tests
  // ============================================

  describe('getVariantReservedQuantity', () => {
    it('should return reservedQuantity from variant', () => {
      const variant = { reservedQuantity: 5 };
      expect(getVariantReservedQuantity(variant)).toBe(5);
    });

    it('should return 0 when no reservedQuantity exists', () => {
      const variant = {};
      expect(getVariantReservedQuantity(variant)).toBe(0);
    });
  });

  // ============================================
  // getVariantAvailableQuantity Tests
  // ============================================

  describe('getVariantAvailableQuantity', () => {
    it('should calculate available as stock - reserved', () => {
      const variant = { stockQuantity: 50, reservedQuantity: 5 };
      expect(getVariantAvailableQuantity(variant)).toBe(45);
    });

    it('should return 0 when reserved >= stock', () => {
      const variant = { stockQuantity: 5, reservedQuantity: 10 };
      expect(getVariantAvailableQuantity(variant)).toBe(0);
    });
  });

  // ============================================
  // getLowStockThreshold Tests
  // ============================================

  describe('getLowStockThreshold', () => {
    it('should return lowStockThreshold from productDataMetaBox', () => {
      const product = {
        productDataMetaBox: { lowStockThreshold: 20 },
      };
      expect(getLowStockThreshold(product)).toBe(20);
    });

    it('should return default 5 when not set', () => {
      const product = {};
      expect(getLowStockThreshold(product)).toBe(5);
    });

    it('should return default 5 when productDataMetaBox has null threshold', () => {
      const product = {
        productDataMetaBox: { lowStockThreshold: null },
      };
      expect(getLowStockThreshold(product)).toBe(5);
    });
  });

  // ============================================
  // isLowStock Tests
  // ============================================

  describe('isLowStock', () => {
    it('should return true when available > 0 and <= threshold', () => {
      const product = {
        manageStock: true,
        stockQuantity: 5,
        reservedQuantity: 0,
        productDataMetaBox: { manageStock: true, lowStockThreshold: 10 },
      };
      expect(isLowStock(product)).toBe(true);
    });

    it('should return false when available > threshold', () => {
      const product = {
        manageStock: true,
        stockQuantity: 100,
        reservedQuantity: 10,
        productDataMetaBox: { manageStock: true, lowStockThreshold: 10 },
      };
      expect(isLowStock(product)).toBe(false);
    });

    it('should return false when stock is 0 (out of stock, not low stock)', () => {
      const product = {
        manageStock: true,
        stockQuantity: 0,
        productDataMetaBox: { manageStock: true },
      };
      expect(isLowStock(product)).toBe(false);
    });

    it('should return false when manageStock is false', () => {
      const product = {
        manageStock: false,
        stockQuantity: 3,
      };
      expect(isLowStock(product)).toBe(false);
    });
  });

  // ============================================
  // isOutOfStock Tests
  // ============================================

  describe('isOutOfStock', () => {
    it('should return true when available <= 0', () => {
      const product = {
        manageStock: true,
        stockQuantity: 0,
        productDataMetaBox: { manageStock: true },
      };
      expect(isOutOfStock(product)).toBe(true);
    });

    it('should return false when available > 0', () => {
      const product = {
        manageStock: true,
        stockQuantity: 10,
        productDataMetaBox: { manageStock: true },
      };
      expect(isOutOfStock(product)).toBe(false);
    });

    it('should check stockStatus when manageStock is false', () => {
      const product = {
        manageStock: false,
        stockStatus: 'outofstock' as const,
      };
      expect(isOutOfStock(product)).toBe(true);
    });
  });

  // ============================================
  // isVariantLowStock Tests
  // ============================================

  describe('isVariantLowStock', () => {
    it('should return true when available > 0 and <= threshold', () => {
      const variant = { stockQuantity: 5, reservedQuantity: 2 };
      expect(isVariantLowStock(variant, 10)).toBe(true);
    });

    it('should return false when available > threshold', () => {
      const variant = { stockQuantity: 50, reservedQuantity: 5 };
      expect(isVariantLowStock(variant, 10)).toBe(false);
    });

    it('should return false when available is 0', () => {
      const variant = { stockQuantity: 0, reservedQuantity: 0 };
      expect(isVariantLowStock(variant, 10)).toBe(false);
    });
  });

  // ============================================
  // buildStockQuantityIncrement Tests
  // ============================================

  describe('buildStockQuantityIncrement', () => {
    it('should build increment object for positive quantity', () => {
      const update = buildStockQuantityIncrement(10);
      expect(update.stockQuantity).toBe(10);
      expect(update['productDataMetaBox.stockQuantity']).toBe(10);
    });

    it('should build decrement object for negative quantity', () => {
      const update = buildStockQuantityIncrement(-5);
      expect(update.stockQuantity).toBe(-5);
      expect(update['productDataMetaBox.stockQuantity']).toBe(-5);
    });
  });

  // ============================================
  // buildVariantStockIncrement Tests
  // ============================================

  describe('buildVariantStockIncrement', () => {
    it('should build variant stock increment update with index', () => {
      const update = buildVariantStockIncrement(0, 10);
      expect(update['variants.0.stock']).toBe(10);
      expect(update['variants.0.stockQuantity']).toBe(10);
    });

    it('should work with different variant indexes', () => {
      const update = buildVariantStockIncrement(2, 5);
      expect(update['variants.2.stock']).toBe(5);
      expect(update['variants.2.stockQuantity']).toBe(5);
    });
  });

  // ============================================
  // calculateStockStatus Tests
  // ============================================

  describe('calculateStockStatus', () => {
    it('should return outofstock when available <= 0', () => {
      expect(calculateStockStatus(0)).toBe('outofstock');
      expect(calculateStockStatus(-1)).toBe('outofstock');
    });

    it('should return instock when available > 0', () => {
      expect(calculateStockStatus(10)).toBe('instock');
      expect(calculateStockStatus(100)).toBe('instock');
    });

    it('should return onbackorder when available <= 0 and backorders allowed', () => {
      expect(calculateStockStatus(0, 'yes')).toBe('onbackorder');
      expect(calculateStockStatus(0, 'notify')).toBe('onbackorder');
    });
  });

  // ============================================
  // buildStockStatusUpdate Tests
  // ============================================

  describe('buildStockStatusUpdate', () => {
    it('should build stock status update object', () => {
      const update = buildStockStatusUpdate('instock');
      expect(update.stockStatus).toBe('instock');
      expect(update['productDataMetaBox.stockStatus']).toBe('instock');
    });

    it('should work with outofstock status', () => {
      const update = buildStockStatusUpdate('outofstock');
      expect(update.stockStatus).toBe('outofstock');
      expect(update['productDataMetaBox.stockStatus']).toBe('outofstock');
    });
  });

  // ============================================
  // canReserveStock Tests
  // ============================================

  describe('canReserveStock', () => {
    it('should return true when enough stock available', () => {
      const product = {
        manageStock: true,
        stockQuantity: 100,
        reservedQuantity: 10,
        productDataMetaBox: { manageStock: true },
      };
      expect(canReserveStock(product, 50)).toBe(true);
    });

    it('should return false when not enough stock', () => {
      const product = {
        manageStock: true,
        stockQuantity: 10,
        reservedQuantity: 5,
        productDataMetaBox: { manageStock: true },
      };
      expect(canReserveStock(product, 10)).toBe(false);
    });

    it('should return true when manageStock is false', () => {
      const product = {
        manageStock: false,
        stockQuantity: 0,
      };
      expect(canReserveStock(product, 100)).toBe(true);
    });
  });

  // ============================================
  // validateStockQuantity Tests
  // ============================================

  describe('validateStockQuantity', () => {
    it('should return true for valid positive number', () => {
      expect(validateStockQuantity(10)).toBe(true);
      expect(validateStockQuantity(0)).toBe(true);
    });

    it('should return false for negative number', () => {
      expect(validateStockQuantity(-5)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(validateStockQuantity(NaN)).toBe(false);
    });
  });
});
