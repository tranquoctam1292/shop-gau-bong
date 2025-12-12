/**
 * Order History Service
 * 
 * Manages order history/audit log entries for traceability.
 * Every status change and important action is logged.
 */

import { getCollections, ObjectId } from '@/lib/db';

export type OrderHistoryAction =
  | 'create'
  | 'update_status'
  | 'update_payment_status'
  | 'payment_received'
  | 'add_item'
  | 'remove_item'
  | 'update_address'
  | 'apply_coupon'
  | 'cancel'
  | 'refund';

export type ActorType = 'admin' | 'customer' | 'system';

export interface OrderHistoryEntry {
  _id?: ObjectId;
  orderId: string;
  action: OrderHistoryAction;
  description: string;
  oldValue?: any;
  newValue?: any;
  actorId?: string;
  actorType: ActorType;
  actorName?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateHistoryEntryParams {
  orderId: string;
  action: OrderHistoryAction;
  description: string;
  oldValue?: any;
  newValue?: any;
  actorId?: string;
  actorType: ActorType;
  actorName?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new order history entry
 * 
 * @param params - History entry parameters
 * @returns Created history entry
 */
export async function createHistoryEntry(
  params: CreateHistoryEntryParams
): Promise<OrderHistoryEntry> {
  const { orderHistories } = await getCollections();

  const historyEntry: OrderHistoryEntry = {
    orderId: params.orderId,
    action: params.action,
    description: params.description,
    oldValue: params.oldValue,
    newValue: params.newValue,
    actorId: params.actorId,
    actorType: params.actorType,
    actorName: params.actorName,
    metadata: params.metadata,
    createdAt: new Date(),
  };

  const result = await orderHistories.insertOne(historyEntry);
  historyEntry._id = result.insertedId;

  return historyEntry;
}

/**
 * Get order history for a specific order
 * 
 * @param orderId - Order ID
 * @returns Array of history entries, sorted by createdAt desc
 */
export async function getOrderHistory(
  orderId: string
): Promise<OrderHistoryEntry[]> {
  const { orderHistories } = await getCollections();

  const histories = await orderHistories
    .find({ orderId })
    .sort({ createdAt: -1 })
    .toArray();

  return histories as OrderHistoryEntry[];
}

/**
 * Create history entry for status change
 * 
 * @param orderId - Order ID
 * @param oldStatus - Previous status
 * @param newStatus - New status
 * @param actorId - ID of person making the change
 * @param actorType - Type of actor (admin, customer, system)
 * @param actorName - Name of actor
 * @param metadata - Additional metadata
 */
export async function createStatusChangeHistory(
  orderId: string,
  oldStatus: string,
  newStatus: string,
  actorId?: string,
  actorType: ActorType = 'admin',
  actorName?: string,
  metadata?: Record<string, any>
): Promise<OrderHistoryEntry> {
  return createHistoryEntry({
    orderId,
    action: 'update_status',
    description: `Đổi trạng thái từ "${oldStatus}" sang "${newStatus}"`,
    oldValue: oldStatus,
    newValue: newStatus,
    actorId,
    actorType,
    actorName,
    metadata: {
      oldStatus,
      newStatus,
      ...metadata,
    },
  });
}

/**
 * Create history entry for payment status change
 * 
 * @param orderId - Order ID
 * @param oldPaymentStatus - Previous payment status
 * @param newPaymentStatus - New payment status
 * @param actorId - ID of person making the change
 * @param actorType - Type of actor
 * @param actorName - Name of actor
 */
export async function createPaymentStatusChangeHistory(
  orderId: string,
  oldPaymentStatus: string,
  newPaymentStatus: string,
  actorId?: string,
  actorType: ActorType = 'admin',
  actorName?: string
): Promise<OrderHistoryEntry> {
  return createHistoryEntry({
    orderId,
    action: 'update_payment_status',
    description: `Đổi trạng thái thanh toán từ "${oldPaymentStatus}" sang "${newPaymentStatus}"`,
    oldValue: oldPaymentStatus,
    newValue: newPaymentStatus,
    actorId,
    actorType,
    actorName,
    metadata: {
      oldPaymentStatus,
      newPaymentStatus,
    },
  });
}

/**
 * Create history entry for order creation
 * 
 * @param orderId - Order ID
 * @param orderNumber - Order number
 * @param customerName - Customer name
 */
export async function createOrderCreationHistory(
  orderId: string,
  orderNumber: string,
  customerName: string
): Promise<OrderHistoryEntry> {
  return createHistoryEntry({
    orderId,
    action: 'create',
    description: `Đơn hàng ${orderNumber} được tạo bởi ${customerName}`,
    actorType: 'customer',
    actorName: customerName,
  });
}

/**
 * Create history entry for order cancellation
 * 
 * @param orderId - Order ID
 * @param reason - Cancellation reason
 * @param actorId - ID of person cancelling
 * @param actorType - Type of actor
 * @param actorName - Name of actor
 */
export async function createCancellationHistory(
  orderId: string,
  reason: string,
  actorId?: string,
  actorType: ActorType = 'admin',
  actorName?: string
): Promise<OrderHistoryEntry> {
  return createHistoryEntry({
    orderId,
    action: 'cancel',
    description: `Đơn hàng bị hủy. Lý do: ${reason}`,
    actorId,
    actorType,
    actorName,
    metadata: { reason },
  });
}

