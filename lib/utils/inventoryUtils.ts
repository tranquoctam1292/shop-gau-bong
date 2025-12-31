/**
 * Inventory Utility Functions
 * Cac ham tien ich cho module quan ly kho
 *
 * Muc dich:
 * - Thong nhat cach doc/ghi stock data
 * - Xu ly cac truong bi trung lap (stock vs stockQuantity)
 * - Xu ly cac vi tri du lieu khac nhau (top-level vs productDataMetaBox)
 */

import type { StockStatus } from '@/types/inventory';

// ============================================
// Type Definitions for internal use
// ============================================

export interface ProductLike {
  manageStock?: boolean;
  stockQuantity?: number | null;
  reservedQuantity?: number | null;
  stockStatus?: StockStatus;
  productDataMetaBox?: {
    manageStock?: boolean;
    stockQuantity?: number | null;
    stockStatus?: StockStatus;
    lowStockThreshold?: number | null;
    backorders?: 'no' | 'notify' | 'yes';
  };
  variants?: VariantLike[];
}

export interface VariantLike {
  id?: string;
  sku?: string;
  size?: string;
  color?: string;
  stock?: number | null;
  stockQuantity?: number | null;
  reservedQuantity?: number | null;
}

// ============================================
// Stock Reading Functions
// ============================================

/**
 * Lay gia tri manageStock tu product
 * Uu tien productDataMetaBox, fallback sang top-level
 */
export function getManageStock(product: ProductLike): boolean {
  // Uu tien productDataMetaBox (new structure)
  if (product.productDataMetaBox?.manageStock !== undefined) {
    return product.productDataMetaBox.manageStock;
  }
  // Fallback to top-level (legacy)
  return product.manageStock ?? false;
}

/**
 * Lay stockQuantity cua simple product
 * Uu tien productDataMetaBox, fallback sang top-level
 */
export function getProductStockQuantity(product: ProductLike): number {
  // Uu tien productDataMetaBox (new structure)
  if (
    product.productDataMetaBox?.stockQuantity !== undefined &&
    product.productDataMetaBox?.stockQuantity !== null
  ) {
    return product.productDataMetaBox.stockQuantity;
  }
  // Fallback to top-level (legacy)
  return product.stockQuantity ?? 0;
}

/**
 * Lay reservedQuantity cua simple product
 */
export function getProductReservedQuantity(product: ProductLike): number {
  return product.reservedQuantity ?? 0;
}

/**
 * Lay available quantity (stock - reserved) cua simple product
 */
export function getProductAvailableQuantity(product: ProductLike): number {
  const stock = getProductStockQuantity(product);
  const reserved = getProductReservedQuantity(product);
  return Math.max(0, stock - reserved);
}

/**
 * Lay stockQuantity cua variant
 * Uu tien stockQuantity, fallback sang stock
 */
export function getVariantStockQuantity(variant: VariantLike): number {
  // Uu tien stockQuantity (consistent voi MongoProduct)
  if (variant.stockQuantity !== undefined && variant.stockQuantity !== null) {
    return variant.stockQuantity;
  }
  // Fallback to stock (legacy)
  return variant.stock ?? 0;
}

/**
 * Lay reservedQuantity cua variant
 */
export function getVariantReservedQuantity(variant: VariantLike): number {
  return variant.reservedQuantity ?? 0;
}

/**
 * Lay available quantity (stock - reserved) cua variant
 */
export function getVariantAvailableQuantity(variant: VariantLike): number {
  const stock = getVariantStockQuantity(variant);
  const reserved = getVariantReservedQuantity(variant);
  return Math.max(0, stock - reserved);
}

/**
 * Lay stockStatus cua product
 * Uu tien productDataMetaBox, fallback sang top-level
 */
export function getStockStatus(product: ProductLike): StockStatus {
  if (product.productDataMetaBox?.stockStatus) {
    return product.productDataMetaBox.stockStatus;
  }
  return product.stockStatus ?? 'instock';
}

/**
 * Lay lowStockThreshold cua product
 */
export function getLowStockThreshold(product: ProductLike): number {
  return product.productDataMetaBox?.lowStockThreshold ?? 5; // Default 5
}

/**
 * Kiem tra product co phai la low stock khong
 */
export function isLowStock(product: ProductLike): boolean {
  if (!getManageStock(product)) {
    return false;
  }

  const available = getProductAvailableQuantity(product);
  const threshold = getLowStockThreshold(product);

  return available > 0 && available <= threshold;
}

/**
 * Kiem tra variant co phai la low stock khong
 */
export function isVariantLowStock(variant: VariantLike, threshold: number = 5): boolean {
  const available = getVariantAvailableQuantity(variant);
  return available > 0 && available <= threshold;
}

/**
 * Kiem tra product het hang
 */
export function isOutOfStock(product: ProductLike): boolean {
  if (!getManageStock(product)) {
    return getStockStatus(product) === 'outofstock';
  }

  const available = getProductAvailableQuantity(product);
  return available <= 0;
}

/**
 * Kiem tra variant het hang
 */
export function isVariantOutOfStock(variant: VariantLike): boolean {
  const available = getVariantAvailableQuantity(variant);
  return available <= 0;
}

// ============================================
// Stock Writing Helpers (for MongoDB updates)
// ============================================

/**
 * Tao update object cho stockQuantity cua simple product
 * Cap nhat CA HAI vi tri de dam bao dong bo
 */
export function buildStockQuantityUpdate(quantity: number): Record<string, number> {
  return {
    stockQuantity: quantity,
    'productDataMetaBox.stockQuantity': quantity,
  };
}

/**
 * Tao increment object cho stockQuantity cua simple product
 * Increment CA HAI vi tri de dam bao dong bo
 */
export function buildStockQuantityIncrement(delta: number): Record<string, number> {
  return {
    stockQuantity: delta,
    'productDataMetaBox.stockQuantity': delta,
  };
}

/**
 * Tao update object cho variant stock
 * Cap nhat CA HAI field de dam bao dong bo
 */
export function buildVariantStockUpdate(
  variantIndex: number,
  quantity: number
): Record<string, number> {
  return {
    [`variants.${variantIndex}.stock`]: quantity,
    [`variants.${variantIndex}.stockQuantity`]: quantity,
  };
}

/**
 * Tao increment object cho variant stock
 * Increment CA HAI field de dam bao dong bo
 */
export function buildVariantStockIncrement(
  variantIndex: number,
  delta: number
): Record<string, number> {
  return {
    [`variants.${variantIndex}.stock`]: delta,
    [`variants.${variantIndex}.stockQuantity`]: delta,
  };
}

/**
 * Tao update object cho manageStock
 * Cap nhat CA HAI vi tri de dam bao dong bo
 */
export function buildManageStockUpdate(value: boolean): Record<string, boolean> {
  return {
    manageStock: value,
    'productDataMetaBox.manageStock': value,
  };
}

// ============================================
// Stock Status Calculation
// ============================================

/**
 * Tinh toan stockStatus dua tren quantity
 */
export function calculateStockStatus(
  availableQuantity: number,
  backorders: 'no' | 'notify' | 'yes' = 'no'
): StockStatus {
  if (availableQuantity > 0) {
    return 'instock';
  }

  if (backorders !== 'no') {
    return 'onbackorder';
  }

  return 'outofstock';
}

/**
 * Tao update object cho stockStatus
 * Cap nhat CA HAI vi tri de dam bao dong bo
 */
export function buildStockStatusUpdate(status: StockStatus): Record<string, StockStatus> {
  return {
    stockStatus: status,
    'productDataMetaBox.stockStatus': status,
  };
}

// ============================================
// Validation Functions
// ============================================

/**
 * Kiem tra co du stock de reserve khong
 */
export function canReserveStock(product: ProductLike, quantity: number): boolean {
  if (!getManageStock(product)) {
    return true; // Khong quan ly stock => luon cho phep
  }

  const available = getProductAvailableQuantity(product);
  return available >= quantity;
}

/**
 * Kiem tra co du stock de reserve variant khong
 */
export function canReserveVariantStock(variant: VariantLike, quantity: number): boolean {
  const available = getVariantAvailableQuantity(variant);
  return available >= quantity;
}

/**
 * Validate stock quantity (khong cho phep so am)
 */
export function validateStockQuantity(quantity: number): boolean {
  return typeof quantity === 'number' && !isNaN(quantity) && quantity >= 0;
}

/**
 * Validate adjustment quantity
 */
export function validateAdjustmentQuantity(quantity: number): boolean {
  return typeof quantity === 'number' && !isNaN(quantity) && quantity !== 0;
}

// ============================================
// Formatting Functions
// ============================================

/**
 * Format stock display
 */
export function formatStockDisplay(stock: number, reserved: number = 0): string {
  if (reserved > 0) {
    return `${stock} (${reserved} dat truoc)`;
  }
  return stock.toString();
}

/**
 * Format available stock display
 */
export function formatAvailableDisplay(stock: number, reserved: number): string {
  const available = Math.max(0, stock - reserved);
  return `${available} kha dung`;
}
