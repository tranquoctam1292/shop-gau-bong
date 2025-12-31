/**
 * Cron Job: Cleanup Orphan Reservations
 * GET /api/cron/cleanup-reservations
 *
 * This endpoint is designed to be called by external cron services
 * (Vercel Cron, cron-job.org, etc.)
 *
 * Security: Uses CRON_SECRET env variable for authentication
 *
 * Recommended schedule: Daily at 3:00 AM Vietnam time
 * Cron expression: 0 3 * * * (or 0 20 * * * UTC)
 *
 * What this job does:
 * 1. Find pending orders older than STALE_ORDER_DAYS (default: 7 days)
 * 2. Release reserved stock for those orders
 * 3. Mark orders as cancelled (with reason: auto_cleanup)
 * 4. Find products with orphan reservations (reservedQuantity > 0 but no pending orders)
 * 5. Reset orphan reservations to 0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import type { WithId, Document } from 'mongodb';

// Configuration
const STALE_ORDER_DAYS = parseInt(process.env.STALE_ORDER_DAYS || '7', 10);

interface CleanupResult {
  staleOrdersProcessed: number;
  reservationsReleased: number;
  orphanProductsFixed: number;
  orphanVariantsFixed: number;
  errors: string[];
}

/**
 * Verify cron secret for security
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no CRON_SECRET is set, only allow in development
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Cron Cleanup] CRON_SECRET not set, allowing in development mode');
      return true;
    }
    return false;
  }

  // Check Bearer token
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check query parameter (for services that don't support headers)
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  if (secretParam === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const result: CleanupResult = {
    staleOrdersProcessed: 0,
    reservationsReleased: 0,
    orphanProductsFixed: 0,
    orphanVariantsFixed: 0,
    errors: [],
  };

  try {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
      console.error('[Cron Cleanup] Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron Cleanup] Starting cleanup job...');

    const { orders, products } = await getCollections();
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - STALE_ORDER_DAYS);

    // ============================================
    // Step 1: Find and process stale pending orders
    // ============================================
    console.log(`[Cron Cleanup] Finding orders older than ${STALE_ORDER_DAYS} days...`);

    const staleOrders = await orders.find({
      status: { $in: ['pending', 'awaiting_payment'] },
      isStockRestored: { $ne: true },
      createdAt: { $lt: staleDate },
    }).toArray();

    console.log(`[Cron Cleanup] Found ${staleOrders.length} stale orders`);

    for (const order of staleOrders) {
      try {
        const orderId = order._id.toString();
        const items = order.items || [];

        // Release reserved stock for each item
        for (const item of items) {
          const productId = item.productId?.toString() || item.product_id?.toString();
          const variationId = item.variationId || item.variation_id;
          const quantity = item.quantity || 1;

          if (!productId) continue;

          try {
            if (variationId) {
              // Variable product
              await products.updateOne(
                {
                  _id: new ObjectId(productId),
                  'variants.id': variationId,
                  'variants.reservedQuantity': { $gte: quantity },
                },
                {
                  $inc: { 'variants.$.reservedQuantity': -quantity },
                  $set: { updatedAt: new Date() },
                }
              );
            } else {
              // Simple product
              await products.updateOne(
                {
                  _id: new ObjectId(productId),
                  reservedQuantity: { $gte: quantity },
                },
                {
                  $inc: { reservedQuantity: -quantity },
                  $set: { updatedAt: new Date() },
                }
              );
            }
            result.reservationsReleased++;
          } catch (itemError) {
            result.errors.push(`Failed to release stock for order ${orderId}, product ${productId}: ${itemError}`);
          }
        }

        // Mark order as cancelled with auto_cleanup reason
        await orders.updateOne(
          { _id: order._id },
          {
            $set: {
              status: 'cancelled',
              isStockRestored: true,
              cancelReason: 'auto_cleanup',
              cancelledAt: new Date(),
              updatedAt: new Date(),
            },
            $push: {
              statusHistory: {
                status: 'cancelled',
                note: `Tự động hủy do quá ${STALE_ORDER_DAYS} ngày không xử lý`,
                changedAt: new Date(),
                changedBy: 'system_cron',
              },
            },
          } as Document
        );

        result.staleOrdersProcessed++;
        console.log(`[Cron Cleanup] Processed stale order: ${order.orderNumber || orderId}`);
      } catch (orderError) {
        result.errors.push(`Failed to process order ${order._id}: ${orderError}`);
      }
    }

    // ============================================
    // Step 2: Find and fix orphan reservations
    // ============================================
    console.log('[Cron Cleanup] Checking for orphan reservations...');

    // Get all pending orders to build a set of reserved product/variant pairs
    const pendingOrders = await orders.find({
      status: { $in: ['pending', 'awaiting_payment'] },
      isStockRestored: { $ne: true },
    }).toArray();

    // Build sets of legitimately reserved items
    const reservedProducts = new Set<string>();
    const reservedVariants = new Set<string>(); // Format: productId:variationId

    for (const order of pendingOrders) {
      const items = order.items || [];
      for (const item of items) {
        const productId = item.productId?.toString() || item.product_id?.toString();
        const variationId = item.variationId || item.variation_id;

        if (productId) {
          if (variationId) {
            reservedVariants.add(`${productId}:${variationId}`);
          } else {
            reservedProducts.add(productId);
          }
        }
      }
    }

    // Find products with reservedQuantity > 0 but not in pending orders
    const productsWithReservations = await products.find({
      $or: [
        { reservedQuantity: { $gt: 0 } },
        { 'variants.reservedQuantity': { $gt: 0 } },
      ],
    }).toArray();

    for (const product of productsWithReservations) {
      const productId = product._id.toString();

      // Check simple product reservation
      if (product.reservedQuantity && product.reservedQuantity > 0) {
        if (!reservedProducts.has(productId)) {
          // Orphan reservation found
          try {
            await products.updateOne(
              { _id: product._id },
              {
                $set: {
                  reservedQuantity: 0,
                  updatedAt: new Date(),
                },
              }
            );
            result.orphanProductsFixed++;
            console.log(`[Cron Cleanup] Fixed orphan reservation for product: ${product.name || productId}`);
          } catch (err) {
            result.errors.push(`Failed to fix orphan reservation for product ${productId}: ${err}`);
          }
        }
      }

      // Check variant reservations
      if (product.variants && Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          if (variant.reservedQuantity && variant.reservedQuantity > 0) {
            const variantKey = `${productId}:${variant.id}`;
            if (!reservedVariants.has(variantKey)) {
              // Orphan variant reservation found
              try {
                await products.updateOne(
                  {
                    _id: product._id,
                    'variants.id': variant.id,
                  },
                  {
                    $set: {
                      'variants.$.reservedQuantity': 0,
                      updatedAt: new Date(),
                    },
                  }
                );
                result.orphanVariantsFixed++;
                console.log(`[Cron Cleanup] Fixed orphan reservation for variant: ${product.name || productId} - ${variant.id}`);
              } catch (err) {
                result.errors.push(`Failed to fix orphan reservation for variant ${productId}:${variant.id}: ${err}`);
              }
            }
          }
        }
      }
    }

    // ============================================
    // Summary
    // ============================================
    console.log('[Cron Cleanup] Job completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      result,
      config: {
        staleOrderDays: STALE_ORDER_DAYS,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Cleanup] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        partialResult: result,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export { GET as POST };
