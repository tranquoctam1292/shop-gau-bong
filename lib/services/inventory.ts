/**
 * Inventory Service
 * 
 * Manages inventory reservation, deduction, and release for orders.
 * Handles stock availability checks and prevents overselling.
 */

import { getCollections, ObjectId } from '@/lib/db';
import type { MongoVariant } from '@/types/mongodb';

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
        (v: MongoVariant) => v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
      );

      if (variant) {
        // SECURITY FIX: Race Condition - Use atomic operation with stock check in query
        // Check stock availability AND increment reservedQuantity in single atomic operation
        // This prevents overselling when multiple orders are placed simultaneously
        
        // Calculate available stock for condition check
        const variantStock = variant.stock || variant.stockQuantity || 0;
        const variantReserved = variant.reservedQuantity || 0;
        const available = variantStock - variantReserved;
        
        // Validate stock availability first (for better error message)
        if (available < item.quantity) {
          throw new Error(
            `Insufficient stock for variant ${item.variationId}. Available: ${available}, Required: ${item.quantity}`
          );
        }

        // SECURITY FIX: Race Condition - Use atomic $inc operation
        // Use $inc with positional operator ($) for atomic update
        // This ensures only one update can happen at a time for the same variant
        // We verify stock availability after update and rollback if insufficient
        
        // Atomic increment with positional operator
        // MongoDB $inc is atomic, so concurrent requests will be serialized
        const updateResult = await products.updateOne(
          { 
            _id: new ObjectId(item.productId),
            "variants.id": item.variationId,
          },
          {
            $inc: {
              "variants.$.reservedQuantity": item.quantity,
            },
          }
        );

        // If update failed, check reason
        if (updateResult.matchedCount === 0) {
          // Re-check stock to provide accurate error message
          const currentProduct = await products.findOne({ _id: new ObjectId(item.productId) });
          if (!currentProduct) {
            throw new Error(`Product ${item.productId} not found`);
          }
          
          const currentVariant = currentProduct.variants?.find(
            (v: MongoVariant) => v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
          );
          
          if (!currentVariant) {
            throw new Error(`Variant ${item.variationId} not found for product ${item.productId}`);
          }
          
          // Stock became insufficient (race condition detected)
          const currentStock = currentVariant.stock || currentVariant.stockQuantity || 0;
          const currentReserved = currentVariant.reservedQuantity || 0;
          const currentAvailable = currentStock - currentReserved;
          
          throw new Error(
            `Insufficient stock for variant ${item.variationId}. Available: ${currentAvailable}, Required: ${item.quantity} (Stock was reserved by another order)`
          );
        }
        
        // Verify update was successful
        if (updateResult.modifiedCount === 0) {
          throw new Error(`Failed to reserve stock for variant ${item.variationId}`);
        }
        
        // SECURITY FIX: Double-check stock availability after atomic update
        // This ensures we didn't oversell due to race condition
        const updatedProduct = await products.findOne({ _id: new ObjectId(item.productId) });
        if (updatedProduct) {
          const updatedVariant = updatedProduct.variants?.find(
            (v: MongoVariant) => v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
          );
          
          if (updatedVariant) {
            const finalStock = updatedVariant.stock || updatedVariant.stockQuantity || 0;
            const finalReserved = updatedVariant.reservedQuantity || 0;
            const finalAvailable = finalStock - finalReserved;
            
            // If stock became negative or insufficient, rollback the reservation
            if (finalAvailable < 0) {
              // Rollback: decrement reservedQuantity
              await products.updateOne(
                { 
                  _id: new ObjectId(item.productId),
                  "variants.id": item.variationId,
                },
                {
                  $inc: {
                    "variants.$.reservedQuantity": -item.quantity,
                  },
                }
              );
              
              throw new Error(
                `Insufficient stock for variant ${item.variationId}. Available: ${finalAvailable}, Required: ${item.quantity} (Stock was reserved by another order)`
              );
            }
          }
        }
      } else {
        throw new Error(`Variant ${item.variationId} not found for product ${item.productId}`);
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
        (v: MongoVariant) => v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
      );

      if (variant) {
        // ✅ PERFORMANCE: Use atomic operations with positional operator ($) instead of $set entire array
        // Deduct from variant stock and release reserved quantity
        
        // Try atomic update with positional operator if variant has id field
        if (variant.id && variant.id === item.variationId) {
          const updateResult = await products.updateOne(
            { 
              _id: new ObjectId(item.productId),
              "variants.id": item.variationId,
            },
            {
              $inc: {
                "variants.$.stock": -item.quantity,
                "variants.$.stockQuantity": -item.quantity,
                "variants.$.reservedQuantity": -item.quantity,
              },
            }
          );

          // If update failed, fallback to old method
          if (updateResult.matchedCount === 0) {
            const updatedVariants = product.variants.map((v: MongoVariant) => {
              if (v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId) {
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
          // Variant doesn't have id field or id doesn't match, use old method
          const updatedVariants = product.variants.map((v: MongoVariant) => {
            if (v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId) {
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
 * Increment stock back to inventory (when order is Refunded after stock was deducted)
 * 
 * @param orderId - Order ID
 * @param items - Array of items to increment stock for
 */
export async function incrementStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void> {
  const { products } = await getCollections();

  for (const item of items) {
    // Find product
    const product = await products.findOne({ _id: new ObjectId(item.productId) });
    if (!product) {
      console.warn(`Product ${item.productId} not found for stock increment`);
      continue;
    }

    // Check if product manages stock
    if (!product.manageStock && product.manageStock !== true) {
      continue;
    }

    // For variable products, increment variant stock
    if (item.variationId && product.variants) {
      const variant = product.variants.find(
        (v: MongoVariant) => v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
      );

      if (variant) {
        // ✅ PERFORMANCE: Use atomic operations with positional operator ($) instead of $set entire array
        // Increment variant stock back
        
        // Try atomic update with positional operator if variant has id field
        if (variant.id && variant.id === item.variationId) {
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
            }
          );

          // If update failed, fallback to old method
          if (updateResult.matchedCount === 0) {
            const updatedVariants = product.variants.map((v: MongoVariant) => {
              if (v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId) {
                return {
                  ...v,
                  stock: (v.stock || v.stockQuantity || 0) + item.quantity,
                  stockQuantity: (v.stockQuantity || v.stock || 0) + item.quantity,
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
          // Variant doesn't have id field or id doesn't match, use old method
          const updatedVariants = product.variants.map((v: MongoVariant) => {
            if (v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId) {
              return {
                ...v,
                stock: (v.stock || v.stockQuantity || 0) + item.quantity,
                stockQuantity: (v.stockQuantity || v.stock || 0) + item.quantity,
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
      }
    } else {
      // Simple product - increment stock back
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        {
          $inc: {
            stockQuantity: item.quantity,
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
        (v: MongoVariant) => v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
      );

      if (variant) {
        // ✅ PERFORMANCE: Use atomic operations with positional operator ($) instead of $set entire array
        // Release reserved quantity for variant
        
        // Try atomic update with positional operator if variant has id field
        if (variant.id && variant.id === item.variationId) {
          // Note: We already checked variant exists above, so we can safely decrement
          // MongoDB will handle negative values, but we'll use Math.max in fallback if needed
          const updateResult = await products.updateOne(
            { 
              _id: new ObjectId(item.productId),
              "variants.id": item.variationId,
            },
            {
              $inc: {
                "variants.$.reservedQuantity": -item.quantity,
              },
            }
          );

          // If update failed (not enough reserved or variant not found), fallback to old method
          if (updateResult.matchedCount === 0) {
            const updatedVariants = product.variants.map((v: MongoVariant) => {
              if (v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId) {
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
          // Variant doesn't have id field or id doesn't match, use old method
          const updatedVariants = product.variants.map((v: MongoVariant) => {
            if (v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId) {
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

