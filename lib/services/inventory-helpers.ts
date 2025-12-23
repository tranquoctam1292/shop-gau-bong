/**
 * Inventory Helper Functions
 * 
 * Internal helper functions for inventory operations with transactions
 */

import { ObjectId } from '@/lib/db';
import type { MongoVariant } from '@/types/mongodb';
import type { Collection, ClientSession } from 'mongodb';

export interface InventoryItem {
  productId: string;
  variationId?: string;
  quantity: number;
}

export interface ProductStockInfo {
  productId: string;
  manageStock: boolean;
  stockQuantity?: number;
  reservedQuantity?: number;
  variants?: MongoVariant[];
}

/**
 * Batch fetch products for inventory operations
 * Reduces N+1 queries by fetching all products at once
 */
export async function batchFetchProducts(
  products: Collection,
  items: InventoryItem[],
  session?: ClientSession
): Promise<Map<string, ProductStockInfo>> {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const productObjectIds = productIds.map((id) => new ObjectId(id));

  const productList = await products
    .find({ _id: { $in: productObjectIds } }, { session })
    .toArray();

  const productMap = new Map<string, ProductStockInfo>();

  for (const product of productList) {
    const productId = product._id.toString();
    // Support both top-level and productDataMetaBox fields
    const productData = product as any;
    const manageStock =
      productData.manageStock !== undefined
        ? Boolean(productData.manageStock)
        : Boolean(productData.productDataMetaBox?.manageStock);
    const stockQuantity =
      productData.stockQuantity !== undefined
        ? (productData.stockQuantity as number | undefined)
        : (productData.productDataMetaBox?.stockQuantity as number | undefined);
    
    productMap.set(productId, {
      productId,
      manageStock,
      stockQuantity,
      reservedQuantity: productData.reservedQuantity as number | undefined,
      variants: productData.variants as MongoVariant[] | undefined,
    });
  }

  return productMap;
}

/**
 * Find variant in product by variationId
 */
export function findVariant(
  product: ProductStockInfo,
  variationId: string
): MongoVariant | undefined {
  if (!product.variants) return undefined;

  return product.variants.find(
    (v: MongoVariant) =>
      v.id === variationId ||
      (v as { _id?: { toString: () => string } })._id?.toString() === variationId
  );
}

/**
 * Validate stock availability for variant
 */
export function validateVariantStock(
  variant: MongoVariant,
  quantity: number
): { available: number; isValid: boolean } {
  const variantStock = variant.stock || variant.stockQuantity || 0;
  const variantReserved = variant.reservedQuantity || 0;
  const available = variantStock - variantReserved;

  return {
    available,
    isValid: available >= quantity,
  };
}

/**
 * Validate stock availability for simple product
 */
export function validateSimpleProductStock(
  product: ProductStockInfo,
  quantity: number
): { available: number; isValid: boolean } {
  const stockQuantity = product.stockQuantity || 0;
  const reservedQuantity = product.reservedQuantity || 0;
  const available = stockQuantity - reservedQuantity;

  return {
    available,
    isValid: available >= quantity,
  };
}

/**
 * Build bulk write operations for variant stock reservation
 */
export function buildVariantReserveOperations(
  items: InventoryItem[],
  productMap: Map<string, ProductStockInfo>
): Array<{
  updateOne: {
    filter: Record<string, unknown>;
    update: { $inc: Record<string, number> };
  };
}> {
  const operations: Array<{
    updateOne: {
      filter: Record<string, unknown>;
      update: { $inc: Record<string, number> };
    };
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    // Skip if product doesn't manage stock (check both manageStock flag and stockQuantity existence)
    if (!product) continue;
    if (!product.manageStock && !product.stockQuantity && !product.variants) continue;
    if (!item.variationId || !product.variants) continue;

    const variant = findVariant(product, item.variationId);
    if (!variant) continue;

    const { isValid } = validateVariantStock(variant, item.quantity);
    if (!isValid) {
      throw new Error(
        `Insufficient stock for variant ${item.variationId}. Required: ${item.quantity}`
      );
    }

    operations.push({
      updateOne: {
        filter: {
          _id: new ObjectId(item.productId),
          'variants.id': item.variationId,
        },
        update: {
          $inc: {
            'variants.$.reservedQuantity': item.quantity,
          },
        },
      },
    });
  }

  return operations;
}

/**
 * Build bulk write operations for simple product stock reservation
 */
export function buildSimpleProductReserveOperations(
  items: InventoryItem[],
  productMap: Map<string, ProductStockInfo>
): Array<{
  updateOne: {
    filter: Record<string, unknown>;
    update: { $inc: Record<string, number> };
  };
}> {
  const operations: Array<{
    updateOne: {
      filter: Record<string, unknown>;
      update: { $inc: Record<string, number> };
    };
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    // Skip if product doesn't manage stock
    if (!product) continue;
    if (!product.manageStock && !product.stockQuantity) continue;
    if (item.variationId) continue; // Skip variants

    const { isValid } = validateSimpleProductStock(product, item.quantity);
    if (!isValid) {
      throw new Error(
        `Insufficient stock for product ${item.productId}. Required: ${item.quantity}`
      );
    }

    operations.push({
      updateOne: {
        filter: {
          _id: new ObjectId(item.productId),
        },
        update: {
          $inc: {
            reservedQuantity: item.quantity,
            // Also update productDataMetaBox.stockQuantity if it exists (for consistency)
            'productDataMetaBox.stockQuantity': 0, // No change to stock, only reserve
          },
        },
      },
    });
  }

  return operations;
}

/**
 * Build bulk write operations for variant stock deduction
 */
export function buildVariantDeductOperations(
  items: InventoryItem[],
  productMap: Map<string, ProductStockInfo>
): Array<{
  updateOne: {
    filter: Record<string, unknown>;
    update: { $inc: Record<string, number> };
  };
}> {
  const operations: Array<{
    updateOne: {
      filter: Record<string, unknown>;
      update: { $inc: Record<string, number> };
    };
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    // Skip if product doesn't manage stock (check both manageStock flag and stockQuantity existence)
    if (!product) continue;
    if (!product.manageStock && !product.stockQuantity && !product.variants) continue;
    if (!item.variationId || !product.variants) continue;

    const variant = findVariant(product, item.variationId);
    if (!variant) continue;

    const { isValid } = validateVariantStock(variant, item.quantity);
    if (!isValid) {
      throw new Error(
        `Insufficient stock for variant ${item.variationId}. Required: ${item.quantity}`
      );
    }

    operations.push({
      updateOne: {
        filter: {
          _id: new ObjectId(item.productId),
          'variants.id': item.variationId,
        },
        update: {
          $inc: {
            'variants.$.stock': -item.quantity,
            'variants.$.stockQuantity': -item.quantity,
            'variants.$.reservedQuantity': -item.quantity,
          },
        },
      },
    });
  }

  return operations;
}

/**
 * Build bulk write operations for simple product stock deduction
 */
export function buildSimpleProductDeductOperations(
  items: InventoryItem[],
  productMap: Map<string, ProductStockInfo>
): Array<{
  updateOne: {
    filter: Record<string, unknown>;
    update: { $inc: Record<string, number> };
  };
}> {
  const operations: Array<{
    updateOne: {
      filter: Record<string, unknown>;
      update: { $inc: Record<string, number> };
    };
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    // Skip if product doesn't manage stock
    if (!product) continue;
    if (!product.manageStock && !product.stockQuantity) continue;
    if (item.variationId) continue; // Skip variants

    const { isValid } = validateSimpleProductStock(product, item.quantity);
    if (!isValid) {
      throw new Error(
        `Insufficient stock for product ${item.productId}. Required: ${item.quantity}`
      );
    }

    operations.push({
      updateOne: {
        filter: {
          _id: new ObjectId(item.productId),
        },
        update: {
          $inc: {
            // Update both top-level and productDataMetaBox for consistency
            stockQuantity: -item.quantity,
            'productDataMetaBox.stockQuantity': -item.quantity,
            reservedQuantity: -item.quantity,
          },
        },
      },
    });
  }

  return operations;
}

