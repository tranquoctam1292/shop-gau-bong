/**
 * Public Order DTO (Data Transfer Object)
 * 
 * Defines the structure of order data returned to customers via public API.
 * Only includes fields necessary for customer-facing features.
 * 
 * SECURITY: This DTO explicitly excludes sensitive fields like:
 * - paymentMetadata (may contain gateway transaction details)
 * - adminNotes (internal admin notes)
 * - cancelledReason (internal cancellation reason)
 * - version (technical field for optimistic locking)
 * - updatedAt (internal timestamp)
 * - _id (use id/orderNumber instead)
 */

export interface PublicOrderItemDTO {
  id: string;
  name: string;
  product_id: string;
  variation_id: string | null;
  quantity: number;
  price: string;
  subtotal: string;
  total: string;
}

export interface PublicOrderDTO {
  // Basic Info
  id: string;
  number: string; // orderNumber
  status: string;
  
  // Payment Info
  payment_method: string;
  payment_method_title: string;
  payment_status: string;
  
  // Totals
  total: string; // For backward compatibility (WooCommerce format)
  grandTotal: number; // Final total after tax/shipping/discount
  currency: string;
  
  // Customer Note (only customer's note, not admin notes)
  customer_note: string;
  
  // Addresses
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
  };
  
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
  };
  
  // Order Items
  line_items: PublicOrderItemDTO[];
  
  // Timestamps
  createdAt: Date | string;
  
  // EXCLUDED FIELDS (for security):
  // - paymentMetadata: May contain sensitive gateway transaction details
  // - adminNotes: Internal admin notes
  // - cancelledReason: Internal cancellation reason
  // - version: Technical field for optimistic locking
  // - updatedAt: Internal timestamp
  // - _id: Use id/orderNumber instead
  // - userId: User ID (if logged in)
  // - channel: Order channel (internal)
  // - trackingNumber: May be sensitive
  // - couponCode: May be sensitive business info
  // - taxTotal, discountTotal, subtotal: Already included in grandTotal
}

/**
 * Map MongoDB order to Public Order DTO
 * 
 * @param order - MongoDB order document
 * @param items - Order items array
 * @returns Public Order DTO (sanitized)
 */
export function mapOrderToPublicDTO(
  order: any,
  items: any[]
): PublicOrderDTO {
  return {
    // Basic Info
    id: order._id?.toString() || '',
    number: order.orderNumber || '',
    status: order.status || 'pending',
    
    // Payment Info
    payment_method: order.paymentMethod || '',
    payment_method_title: order.paymentMethodTitle || '',
    payment_status: order.paymentStatus || 'pending',
    
    // Totals
    total: String(order.grandTotal || 0), // For backward compatibility
    grandTotal: order.grandTotal || 0,
    currency: order.currency || 'VND',
    
    // Customer Note (only customer's note)
    customer_note: order.customerNote || '',
    
    // Addresses
    billing: {
      first_name: order.billing?.firstName || '',
      last_name: order.billing?.lastName || '',
      email: order.customerEmail || '',
      phone: order.customerPhone || '',
      address_1: order.billing?.address1 || '',
      address_2: order.billing?.address2 || '',
      city: order.billing?.city || '',
      postcode: order.billing?.postcode || '',
      country: order.billing?.country || 'VN',
    },
    
    shipping: {
      first_name: order.shipping?.firstName || '',
      last_name: order.shipping?.lastName || '',
      address_1: order.shipping?.address1 || '',
      address_2: order.shipping?.address2 || '',
      city: order.shipping?.city || '',
      postcode: order.shipping?.postcode || '',
      country: order.shipping?.country || 'VN',
    },
    
    // Order Items
    line_items: items.map((item) => ({
      id: item._id?.toString() || '',
      name: item.productName || '',
      product_id: item.productId || '',
      variation_id: item.variationId || null,
      quantity: item.quantity || 0,
      price: String(item.price || 0),
      subtotal: String(item.subtotal || 0),
      total: String(item.total || 0),
    })),
    
    // Timestamps
    createdAt: order.createdAt || new Date(),
    
    // NOTE: Explicitly NOT including:
    // - paymentMetadata (sensitive gateway data)
    // - adminNotes (internal notes)
    // - cancelledReason (internal reason)
    // - version (technical field)
    // - updatedAt (internal timestamp)
    // - _id (use id instead)
    // - userId, channel, trackingNumber, couponCode, etc.
  };
}

