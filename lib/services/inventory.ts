/**
 * Inventory Service
 * 
 * Manages inventory reservation, deduction, and release for orders.
 * Handles stock availability checks and prevents overselling.
 * 
 * SECURITY FIX (2025-01): Added MongoDB Transactions to prevent race conditions
 * and ensure atomicity across multiple inventory operations.
 */

import { getCollections, ObjectId } from '@/lib/db';
import type { MongoVariant } from '@/types/mongodb';
import { withTransaction, getCollectionsWithSession } from '@/lib/utils/transactionHelper';
import type { ClientSession } from 'mongodb';

export interface StockReservation {
  orderId: string;
  productId: string;
  variationId?: string;
  quantity: number;
  reservedAt: Date;
}

export interface StockCheckResult {
  available: number;
  reserved: number;
  total: number;
  canFulfill: boolean;
}

/**
 * Reserve stock for an order (when order status is Pending)
 * 
 * SECURITY FIX (2025-01): Uses MongoDB Transactions to ensure atomicity
 * and prevent race conditions. All items are reserved atomically - if any
 * item fails, all reservations are rolled back automatically.
 * 
 * PERFORMANCE FIX: Uses batch operations to reduce N+1 queries.
 * 
 * @param orderId - Order ID
 * @param items - Array of items to reserve stock for
 * @returns Array of reservation results
 */
export async function reserveStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void> {
  if (items.length === 0) return;

  // Use transaction to ensure atomicity
  try {
    await withTransaction(async (session) => {
      const collections = await getCollectionsWithSession(session);
      const { products } = collections;
      
      const { reserveStockInternal } = await import('./inventory-internal');
      await reserveStockInternal(products, items, session);
    });
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to reserve stock: ${String(error)}`);
  }
}

/**
 * Deduct stock from inventory (when order is Confirmed/Paid)
 * 
 * SECURITY FIX (2025-01): Uses MongoDB Transactions to ensure atomicity
 * and prevent race conditions. All items are deducted atomically - if any
 * item fails, all deductions are rolled back automatically.
 * 
 * PERFORMANCE FIX: Uses batch operations to reduce N+1 queries.
 * 
 * @param orderId - Order ID
 * @param items - Array of items to deduct stock for
 */
export async function deductStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void> {
  if (items.length === 0) return;

  // Use transaction to ensure atomicity
  try {
    await withTransaction(async (session) => {
      const collections = await getCollectionsWithSession(session);
      const { products } = collections;
      
      const { deductStockInternal } = await import('./inventory-internal');
      await deductStockInternal(products, items, session);
    });
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to deduct stock: ${String(error)}`);
  }
}

/**
 * Increment stock back to inventory (when order is Refunded after stock was deducted)
 *
 * SECURITY FIX (BUG-04): Uses MongoDB Transaction to ensure atomicity
 * Both the isStockRestored flag update and stock increment happen in the same transaction.
 * If stock increment fails, the isStockRestored flag is also rolled back.
 *
 * @param orderId - Order ID
 * @param items - Array of items to increment stock for
 */
export async function incrementStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void> {
  if (items.length === 0) return;

  try {
    await withTransaction(async (session) => {
      const collections = await getCollectionsWithSession(session);
      const { products, orders } = collections;

      // SECURITY FIX: Atomic check-and-set isStockRestored flag INSIDE transaction
      const orderResult = await orders.findOneAndUpdate(
        {
          _id: new ObjectId(orderId),
          isStockRestored: { $ne: true }
        },
        {
          $set: {
            isStockRestored: true,
            updatedAt: new Date()
          }
        },
        { session, returnDocument: 'after' }
      );

      // If order not found or already restored, exit (transaction will commit with no changes)
      if (!orderResult) {
        console.warn(`[Increment Stock] Order ${orderId} not found or stock already restored.`);
        return;
      }

      // Process each item
      for (const item of items) {
        const product = await products.findOne(
          { _id: new ObjectId(item.productId) },
          { session }
        );

        if (!product) {
          console.warn(`Product ${item.productId} not found for stock increment`);
          continue;
        }

        // Check if product manages stock
        const manageStock = product.productDataMetaBox?.manageStock ?? product.manageStock ?? false;
        if (!manageStock) {
          continue;
        }

        if (item.variationId && product.variants) {
          // Variable product - increment variant stock
          const updateResult = await products.updateOne(
            {
              _id: new ObjectId(item.productId),
              "variants.id": item.variationId,
            },
            {
              $inc: {
                "variants.$.stock": item.quantity,
                "variants.$.stockQuantity": item.quantity,
              },
              $set: { updatedAt: new Date() }
            },
            { session }
          );

          if (updateResult.matchedCount === 0) {
            throw new Error(`Variant ${item.variationId} not found for product ${item.productId}`);
          }
        } else {
          // Simple product - increment stock
          await products.updateOne(
            { _id: new ObjectId(item.productId) },
            {
              $inc: {
                stockQuantity: item.quantity,
                'productDataMetaBox.stockQuantity': item.quantity,
              },
              $set: { updatedAt: new Date() }
            },
            { session }
          );
        }
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to increment stock: ${String(error)}`);
  }
}

/**
 * Release reserved stock (when order is Cancelled)
 *
 * SECURITY FIX (BUG-04): Uses MongoDB Transaction to ensure atomicity
 * Both the isStockRestored flag update and reserved quantity release happen in the same transaction.
 * If release fails, the isStockRestored flag is also rolled back.
 *
 * @param orderId - Order ID
 * @param items - Array of items to release stock for
 */
export async function releaseStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void> {
  if (items.length === 0) return;

  try {
    await withTransaction(async (session) => {
      const collections = await getCollectionsWithSession(session);
      const { products, orders } = collections;

      // SECURITY FIX: Atomic check-and-set isStockRestored flag INSIDE transaction
      const orderResult = await orders.findOneAndUpdate(
        {
          _id: new ObjectId(orderId),
          isStockRestored: { $ne: true }
        },
        {
          $set: {
            isStockRestored: true,
            updatedAt: new Date()
          }
        },
        { session, returnDocument: 'after' }
      );

      // If order not found or already restored, exit
      if (!orderResult) {
        console.warn(`[Release Stock] Order ${orderId} not found or stock already restored.`);
        return;
      }

      // Process each item
      for (const item of items) {
        const product = await products.findOne(
          { _id: new ObjectId(item.productId) },
          { session }
        );

        if (!product) {
          console.warn(`Product ${item.productId} not found for stock release`);
          continue;
        }

        // Check if product manages stock
        const manageStock = product.productDataMetaBox?.manageStock ?? product.manageStock ?? false;
        if (!manageStock) {
          continue;
        }

        if (item.variationId && product.variants) {
          // Variable product - release variant reserved stock
          const updateResult = await products.updateOne(
            {
              _id: new ObjectId(item.productId),
              "variants.id": item.variationId,
            },
            {
              $inc: {
                "variants.$.reservedQuantity": -item.quantity,
              },
              $set: { updatedAt: new Date() }
            },
            { session }
          );

          if (updateResult.matchedCount === 0) {
            throw new Error(`Variant ${item.variationId} not found for product ${item.productId}`);
          }
        } else {
          // Simple product - release reserved quantity
          await products.updateOne(
            { _id: new ObjectId(item.productId) },
            {
              $inc: {
                reservedQuantity: -item.quantity,
              },
              $set: { updatedAt: new Date() }
            },
            { session }
          );
        }
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to release stock: ${String(error)}`);
  }
}

/**
 * Check stock availability for a product/variant
 * 
 * @param productId - Product ID
 * @param variationId - Variation ID (optional, for variable products)
 * @param quantity - Required quantity
 * @returns Stock check result
 */
export async function checkStockAvailability(
  productId: string,
  variationId?: string,
  quantity: number = 1
): Promise<StockCheckResult> {
  const { products } = await getCollections();

  const product = await products.findOne({ _id: new ObjectId(productId) });
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // If product doesn't manage stock, return unlimited availability
  // FIX BUG-01: Use proper check for manageStock
  const manageStock = product.productDataMetaBox?.manageStock ?? product.manageStock ?? false;
  if (!manageStock) {
    return {
      available: Infinity,
      reserved: 0,
      total: Infinity,
      canFulfill: true,
    };
  }

  // For variable products, check variant stock
  if (variationId && product.variants) {
    const variant = product.variants.find(
      (v: MongoVariant) => v.id === variationId || (v as { _id?: { toString: () => string } })._id?.toString() === variationId
    );

    if (variant) {
      const total = variant.stock || variant.stockQuantity || 0;
      const reserved = variant.reservedQuantity || 0;
      const available = total - reserved;

      return {
        available,
        reserved,
        total,
        canFulfill: available >= quantity,
      };
    }
  }

  // Simple product or no variant
  const total = product.stockQuantity || 0;
  const reserved = product.reservedQuantity || 0;
  const available = total - reserved;

  return {
    available,
    reserved,
    total,
    canFulfill: available >= quantity,
  };
}

/**
 * Get stock information for multiple products
 * 
 * @param productIds - Array of product IDs
 * @returns Map of productId -> StockCheckResult
 */
export async function getStockInfo(
  productIds: string[]
): Promise<Record<string, StockCheckResult>> {
  const { products } = await getCollections();
  const result: Record<string, StockCheckResult> = {};

  const productObjects = productIds.map((id) => new ObjectId(id));
  const productList = await products
    .find({ _id: { $in: productObjects } })
    .toArray();

  for (const product of productList) {
    const productId = product._id.toString();
    const total = product.stockQuantity || 0;
    const reserved = product.reservedQuantity || 0;
    const available = total - reserved;

    result[productId] = {
      available: product.manageStock ? available : Infinity,
      reserved: product.manageStock ? reserved : 0,
      total: product.manageStock ? total : Infinity,
      canFulfill: !product.manageStock || available > 0,
    };
  }

  return result;
}

