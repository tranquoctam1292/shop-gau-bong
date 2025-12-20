/**
 * Refund Service
 * 
 * Manages refund processing for orders.
 * Supports partial and full refunds.
 */

import { getCollections, ObjectId } from '@/lib/db';
import { incrementStock, releaseStock } from '@/lib/services/inventory';
import type { OrderStatus } from '@/lib/utils/orderStateMachine';

export interface RefundData {
  orderId: string;
  amount: number; // Refund amount in VND
  reason?: string;
  type: 'partial' | 'full';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod?: string; // Original payment method
  refundMethod?: string; // How refund is processed (original, bank_transfer, etc.)
  transactionId?: string; // External transaction ID (from payment gateway)
  createdAt: Date;
  updatedAt: Date;
  processedBy?: string; // Admin user ID or email
  processedAt?: Date;
}

/**
 * Process refund for an order
 * 
 * @param orderId - Order ID
 * @param amount - Refund amount (must be <= order grandTotal)
 * @param reason - Refund reason (optional)
 * @param processedBy - Admin user ID or email (optional)
 * @returns Created refund data
 */
export async function processRefund(
  orderId: string,
  amount: number,
  reason?: string,
  processedBy?: string
): Promise<RefundData> {
  const { orders, refunds } = await getCollections();

  // Find order
  const order = await orders.findOne({ _id: new ObjectId(orderId) });
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Validate order can be refunded
  // Allow refund if paymentStatus is 'paid' OR if it's 'refunded' but there's remaining refundable amount
  const grandTotal = order.grandTotal || 0; // Final total after tax/shipping/discount
  const existingRefunds = await refunds
    .find({ orderId, status: { $in: ['pending', 'processing', 'completed'] } })
    .toArray();
  const totalRefunded = existingRefunds.reduce((sum, refund) => sum + (refund.amount || 0), 0);
  const remainingRefundable = grandTotal - totalRefunded;

  if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded') {
    throw new Error(`Order payment status must be "paid" or "refunded" to process refund. Current status: "${order.paymentStatus}"`);
  }

  // If already refunded, check if there's remaining amount
  if (order.paymentStatus === 'refunded' && remainingRefundable <= 0) {
    throw new Error('Order has already been fully refunded');
  }

  // Validate refund amount
  if (amount <= 0) {
    throw new Error('Refund amount must be greater than 0');
  }

  if (amount > grandTotal) {
    throw new Error(`Refund amount (${amount}) cannot exceed order total (${grandTotal})`);
  }

  if (amount > remainingRefundable) {
    throw new Error(
      `Refund amount (${amount}) exceeds remaining refundable amount (${remainingRefundable}). Already refunded: ${totalRefunded}`
    );
  }

  // Determine refund type
  const isFullRefund = amount >= remainingRefundable;

  // Create refund record
  const refundData: RefundData = {
    orderId,
    amount,
    reason: reason || undefined,
    type: isFullRefund ? 'full' : 'partial',
    status: 'pending', // Will be updated when payment gateway processes it
    paymentMethod: order.paymentMethod,
    createdAt: new Date(),
    updatedAt: new Date(),
    processedBy: processedBy || undefined,
  };

  const result = await refunds.insertOne(refundData);

  // Update order payment status and status
  const updateData: any = {
    updatedAt: new Date(),
  };

  // If full refund, update order status to refunded
  if (isFullRefund) {
    updateData.paymentStatus = 'refunded';
    updateData.status = 'refunded';
  } else {
    // Partial refund - keep payment status as 'paid' but add refunded amount
    // We can track this via refunds collection
    updateData.paymentStatus = 'refunded'; // Or keep as 'paid' if partial refunds are allowed
  }

  await orders.updateOne({ _id: new ObjectId(orderId) }, { $set: updateData });

  // SECURITY FIX: Double Restoration Risk
  // Prevent stock from being restored multiple times (e.g., refunded then cancelled)
  // Check stockRestored flag before restoring stock
  const orderStatus = order.status as OrderStatus;
  const statusesWithDeductedStock: OrderStatus[] = ['confirmed', 'processing', 'shipping', 'completed'];
  const stockRestored = (order as any).stockRestored === true; // Check if stock was already restored
  
  if (isFullRefund && statusesWithDeductedStock.includes(orderStatus)) {
    // Full refund + order was already confirmed, stock was deducted - need to restore it
    // SECURITY FIX: Only restore if not already restored (prevent double restoration)
    if (!stockRestored) {
      try {
        // Fetch order items
        const { orderItems } = await getCollections();
        const items = await orderItems.find({ orderId }).toArray();
        
        if (items.length > 0) {
          const itemsForInventory = items.map((item) => ({
            productId: item.productId as string,
            variationId: item.variationId as string | undefined,
            quantity: item.quantity as number,
          }));
          
          // Restore stock back to inventory
          await incrementStock(orderId, itemsForInventory);
          
          // SECURITY FIX: Mark stock as restored to prevent double restoration
          await orders.updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { stockRestored: true, updatedAt: new Date() } }
          );
        }
      } catch (inventoryError: unknown) {
        // Log error but don't fail refund (to prevent data inconsistency)
        console.error('[Refund Service] Stock restoration error:', inventoryError);
        // Continue with refund processing even if stock restoration fails
        // This will be logged for manual intervention
      }
    } else {
      // Stock was already restored (e.g., from previous refund or cancellation)
      console.warn(`[Refund Service] Stock already restored for order ${orderId}. Skipping stock restoration to prevent double restoration.`);
    }
  } else if (orderStatus === 'pending' || orderStatus === 'awaiting_payment') {
    // Order was not confirmed yet, only reserved stock - release reserved quantity
    // This applies to both full and partial refunds for pending orders
    // SECURITY FIX: Only release if not already released (prevent double release)
    // Note: For pending orders, we use reservedStockReleased flag instead of stockRestored
    const reservedStockReleased = (order as any).reservedStockReleased === true;
    
    if (!reservedStockReleased) {
      try {
        const { orderItems } = await getCollections();
        const items = await orderItems.find({ orderId }).toArray();
        
        if (items.length > 0) {
          const itemsForInventory = items.map((item) => ({
            productId: item.productId as string,
            variationId: item.variationId as string | undefined,
            quantity: item.quantity as number,
          }));
          
          // Release reserved stock (stock was never deducted, only reserved)
          await releaseStock(orderId, itemsForInventory);
          
          // SECURITY FIX: Mark reserved stock as released to prevent double release
          await orders.updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { reservedStockReleased: true, updatedAt: new Date() } }
          );
        }
      } catch (inventoryError: unknown) {
        // Log error but don't fail refund
        console.error('[Refund Service] Stock release error:', inventoryError);
      }
    } else {
      console.warn(`[Refund Service] Reserved stock already released for order ${orderId}. Skipping stock release to prevent double release.`);
    }
  }

  // Fetch the created refund with _id
  const createdRefund = await refunds.findOne({ _id: result.insertedId });
  if (!createdRefund) {
    throw new Error('Failed to create refund');
  }

  return {
    ...createdRefund,
    _id: createdRefund._id,
  } as RefundData & { _id: ObjectId };
}

/**
 * Get refunds for an order
 * 
 * @param orderId - Order ID
 * @returns Array of refund records
 */
export async function getOrderRefunds(orderId: string): Promise<RefundData[]> {
  const { refunds } = await getCollections();
  const refundList = await refunds
    .find({ orderId })
    .sort({ createdAt: -1 })
    .toArray();
  return refundList.map((r) => ({
    orderId: r.orderId as string,
    amount: r.amount as number,
    reason: r.reason as string | undefined,
    type: r.type as 'partial' | 'full',
    status: r.status as 'pending' | 'processing' | 'completed' | 'failed',
    paymentMethod: r.paymentMethod as string | undefined,
    refundMethod: r.refundMethod as string | undefined,
    transactionId: r.transactionId as string | undefined,
    createdAt: r.createdAt as Date,
    updatedAt: r.updatedAt as Date,
    processedBy: r.processedBy as string | undefined,
    processedAt: r.processedAt as Date | undefined,
  }));
}

/**
 * Get total refunded amount for an order
 * 
 * @param orderId - Order ID
 * @returns Total refunded amount
 */
export async function getTotalRefunded(orderId: string): Promise<number> {
  const { refunds } = await getCollections();
  const refundList = await refunds
    .find({
      orderId,
      status: { $in: ['pending', 'processing', 'completed'] },
    })
    .toArray();
  return refundList.reduce((sum, refund) => sum + (refund.amount || 0), 0);
}

/**
 * Update refund status
 * 
 * @param refundId - Refund ID
 * @param status - New status
 * @param transactionId - Transaction ID from payment gateway (optional)
 */
export async function updateRefundStatus(
  refundId: string,
  status: RefundData['status'],
  transactionId?: string
): Promise<void> {
  const { refunds } = await getCollections();

  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'completed') {
    updateData.processedAt = new Date();
  }

  if (transactionId) {
    updateData.transactionId = transactionId;
  }

  await refunds.updateOne({ _id: new ObjectId(refundId) }, { $set: updateData });
}

