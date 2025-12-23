/**
 * Internal Inventory Functions
 * 
 * Internal functions that accept session parameter for use within transactions.
 * These are used when inventory operations need to be part of a larger transaction.
 */

import { ObjectId } from '@/lib/db';
import type { MongoVariant } from '@/types/mongodb';
import type { ClientSession } from 'mongodb';
import {
  batchFetchProducts,
  buildVariantReserveOperations,
  buildSimpleProductReserveOperations,
  buildVariantDeductOperations,
  buildSimpleProductDeductOperations,
  type InventoryItem,
} from './inventory-helpers';

/**
 * Internal: Reserve stock within an existing transaction
 * 
 * @param products - Products collection
 * @param items - Array of items to reserve stock for
 * @param session - MongoDB session (required)
 */
export async function reserveStockInternal(
  products: any, // Collection type
  items: InventoryItem[],
  session: ClientSession
): Promise<void> {
  if (items.length === 0) return;

  // Batch fetch all products (reduces N+1 queries)
  const productMap = await batchFetchProducts(products, items, session);

  // Validate all products exist
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
  }

  // Build bulk operations for variants and simple products
  const variantOps = buildVariantReserveOperations(items, productMap);
  const simpleProductOps = buildSimpleProductReserveOperations(items, productMap);

  // Execute bulk operations within transaction
  if (variantOps.length > 0) {
    const variantResult = await products.bulkWrite(variantOps, { session });
    if (variantResult.modifiedCount !== variantOps.length) {
      throw new Error(
        `Failed to reserve stock for some variants. Modified: ${variantResult.modifiedCount}, Expected: ${variantOps.length}`
      );
    }
  }

  if (simpleProductOps.length > 0) {
    const simpleResult = await products.bulkWrite(simpleProductOps, { session });
    if (simpleResult.modifiedCount !== simpleProductOps.length) {
      throw new Error(
        `Failed to reserve stock for some products. Modified: ${simpleResult.modifiedCount}, Expected: ${simpleProductOps.length}`
      );
    }
  }
}

/**
 * Internal: Deduct stock within an existing transaction
 * 
 * @param products - Products collection
 * @param items - Array of items to deduct stock for
 * @param session - MongoDB session (required)
 */
export async function deductStockInternal(
  products: any, // Collection type
  items: InventoryItem[],
  session: ClientSession
): Promise<void> {
  if (items.length === 0) return;

  // Batch fetch all products (reduces N+1 queries)
  const productMap = await batchFetchProducts(products, items, session);

  // Validate all products exist (skip missing products with warning)
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      console.warn(`Product ${item.productId} not found for stock deduction`);
      continue;
    }
    if (!product.manageStock) {
      continue; // Skip products that don't manage stock
    }
  }

  // Build bulk operations for variants and simple products
  const variantOps = buildVariantDeductOperations(items, productMap);
  const simpleProductOps = buildSimpleProductDeductOperations(items, productMap);

  // Execute bulk operations within transaction
  if (variantOps.length > 0) {
    const variantResult = await products.bulkWrite(variantOps, { session });
    if (variantResult.modifiedCount !== variantOps.length) {
      throw new Error(
        `Failed to deduct stock for some variants. Modified: ${variantResult.modifiedCount}, Expected: ${variantOps.length}`
      );
    }
  }

  if (simpleProductOps.length > 0) {
    const simpleResult = await products.bulkWrite(simpleProductOps, { session });
    if (simpleResult.modifiedCount !== simpleProductOps.length) {
      throw new Error(
        `Failed to deduct stock for some products. Modified: ${simpleResult.modifiedCount}, Expected: ${simpleProductOps.length}`
      );
    }
  }
}

/**
 * Internal: Release reserved stock within an existing transaction
 * (Simplified version without isStockRestored check - for order items operations)
 * 
 * @param products - Products collection
 * @param items - Array of items to release stock for
 * @param session - MongoDB session (required)
 */
export async function releaseStockInternal(
  products: any, // Collection type
  items: InventoryItem[],
  session: ClientSession
): Promise<void> {
  if (items.length === 0) return;

  // Batch fetch all products (reduces N+1 queries)
  const productMap = await batchFetchProducts(products, items, session);

  const operations: Array<{
    updateOne: {
      filter: Record<string, unknown>;
      update: { $inc: Record<string, number> };
    };
  }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || !product.manageStock) continue;

    if (item.variationId && product.variants) {
      // Variant product
      const variant = product.variants.find(
        (v: any) =>
          v.id === item.variationId ||
          (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
      );

      if (variant) {
        operations.push({
          updateOne: {
            filter: {
              _id: new ObjectId(item.productId),
              'variants.id': item.variationId,
            },
            update: {
              $inc: {
                'variants.$.reservedQuantity': -item.quantity,
              },
            },
          },
        });
      }
    } else {
      // Simple product
      operations.push({
        updateOne: {
          filter: {
            _id: new ObjectId(item.productId),
          },
          update: {
            $inc: {
              reservedQuantity: -item.quantity,
            },
          },
        },
      });
    }
  }

  if (operations.length > 0) {
    await products.bulkWrite(operations, { session });
  }
}

