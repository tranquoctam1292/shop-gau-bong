/**
 * Order Types
 * 
 * Type definitions for Order entities in the system
 */

/**
 * Order Item for Quick View
 * Lightweight version of order item with only essential fields
 */
export interface OrderQuickViewItem {
  _id: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

/**
 * Order Quick View
 * Lightweight order data for quick view dialog
 * Contains only essential fields, no histories, refunds, shipments
 */
export interface OrderQuickView {
  _id: string;
  orderNumber: string;
  status: 'pending' | 'awaiting_payment' | 'confirmed' | 'processing' | 'shipping' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cod' | 'vietqr' | 'momo' | 'bank_transfer';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  grandTotal: number;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    ward?: string;
    district?: string;
    province?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
  shipping?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    district?: string;
    ward?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
  items: OrderQuickViewItem[];
}

