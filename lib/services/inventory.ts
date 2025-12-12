/**
 * Inventory Service
 * 
 * Manages inventory reservation, deduction, and release for orders.
 * Handles stock availability checks and prevents overselling.
 */

import { getCollections, ObjectId } from '@/lib/db';

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
 * @param orderId - Order ID
 * @param items - Array of items to reserve stock for
 * @returns Array of reservation results
 */
export async function reserveStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void> {
  const { products } = await getCollections();

  for (const item of items) {
    // Find product
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }

    // Check if product manages stock
    if (!product.manageStock && product.manageStock !== true) {
      // Product doesn't manage stock, skip reservation
      continue;
    }

    // For variable products, check variant stock
    if (item.variationId && product.variants) {
      const variant = product.variants.find(
        (v: any) => v.id === item.variationId || v._id?.toString() === item.variationId
      );

      if (variant) {
        // Check variant stock availability
        const variantStock = variant.stock || variant.stockQuantity || 0;
        const variantReserved = variant.reservedQuantity || 0;
        const available = variantStock - variantReserved;

        if (available < item.quantity) {
          throw new Error(
            `Insufficient stock for variant ${item.variationId}. Available: ${available}, Required: ${item.quantity}`
          );
        }

        // Reserve stock for variant
        // MongoDB doesn't support $ positional operator with nested queries easily
        // We need to update the entire variants array
        const updatedVariants = product.variants.map((v: any) => {
          if (v.id === item.variationId || v._id?.toString() === item.variationId) {
            return {
              ...v,
              reservedQuantity: (v.reservedQuantity || 0) + item.quantity,
            };
          }
          return v;
        });

        await products.updateOne(
          { _id: new ObjectId(item.productId) },
          {
            $set: {
              variants: updatedVariants,
            },
          }
        );
      }
    } else {
      // Simple product or no variant specified
      const stockQuantity = product.stockQuantity || 0;
      const reservedQuantity = product.reservedQuantity || 0;
      const available = stockQuantity - reservedQuantity;

      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${item.productId}. Available: ${available}, Required: ${item.quantity}`
        );
      }

      // Reserve stock
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        {
          $inc: {
            reservedQuantity: item.quantity,
          },
        }
      );
    }
  }
}

/**
 * Deduct stock from inventory (when order is Confirmed/Paid)
 * 
 * @param orderId - Order ID
 * @param items - Array of items to deduct stock for
 */
export async function deductStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void> {
  const { products } = await getCollections();

  for (const item of items) {
    // Find product
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) {
      console.warn(`Product ${item.productId} not found for stock deduction`);
      continue;
    }

    // Check if product manages stock
    if (!product.manageStock && product.manageStock !== true) {
      continue;
    }

    // For variable products, deduct from variant stock
    if (item.variationId && product.variants) {
      const variant = product.variants.find(
        (v: any) => v.id === item.variationId || v._id?.toString() === item.variationId
      );

      if (variant) {
        // Deduct from variant stock and release reserved quantity
        const updatedVariants = product.variants.map((v: any) => {
          if (v.id === item.variationId || v._id?.toString() === item.variationId) {
            return {
              ...v,
              stock: (v.stock || v.stockQuantity || 0) - item.quantity,
              stockQuantity: (v.stockQuantity || v.stock || 0) - item.quantity,
              reservedQuantity: Math.max(0, (v.reservedQuantity || 0) - item.quantity),
            };
          }
          return v;
        });

        await products.updateOne(
          { _id: new ObjectId(item.productId) },
          {
            $set: {
              variants: updatedVariants,
            },
          }
        );
      }
    } else {
      // Simple product - deduct from stock and release reserved quantity
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        {
          $inc: {
            stockQuantity: -item.quantity,
            reservedQuantity: -item.quantity,
          },
        }
      );
    }
  }
}

/**
 * Release reserved stock (when order is Cancelled)
 * 
 * @param orderId - Order ID
 * @param items - Array of items to release stock for
 */
export async function releaseStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void> {
  const { products } = await getCollections();

  for (const item of items) {
    // Find product
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) {
      console.warn(`Product ${item.productId} not found for stock release`);
      continue;
    }

    // Check if product manages stock
    if (!product.manageStock && product.manageStock !== true) {
      continue;
    }

    // For variable products, release variant reserved stock
    if (item.variationId && product.variants) {
      const variant = product.variants.find(
        (v: any) => v.id === item.variationId || v._id?.toString() === item.variationId
      );

      if (variant) {
        // Release reserved quantity for variant
        const updatedVariants = product.variants.map((v: any) => {
          if (v.id === item.variationId || v._id?.toString() === item.variationId) {
            return {
              ...v,
              reservedQuantity: Math.max(0, (v.reservedQuantity || 0) - item.quantity),
            };
          }
          return v;
        });

        await products.updateOne(
          { _id: new ObjectId(item.productId) },
          {
            $set: {
              variants: updatedVariants,
            },
          }
        );
      }
    } else {
      // Simple product - release reserved quantity
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        {
          $inc: {
            reservedQuantity: -item.quantity,
          },
        }
      );
    }
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
  if (!product.manageStock && product.manageStock !== true) {
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
      (v: any) => v.id === variationId || v._id?.toString() === variationId
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

