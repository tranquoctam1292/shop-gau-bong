/**
 * Invoice Utility Functions for REST API
 * Helper functions để format order data cho PDF invoice
 * Supports both WooCommerce REST API format (legacy) and MongoDB format
 */

import type { WooCommerceOrder } from '@/types/woocommerce';
import type { MongoOrder } from '@/types/mongodb';

export interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  status: string;
  billing: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  shipping: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  subtotal: string;
  shippingTotal: string;
  totalTax: string;
  total: string;
  currency: string;
  paymentMethod?: string;
  customerNote?: string;
}

// MongoOrder type is now imported from @/types/mongodb

/**
 * Convert WooCommerce REST API Order data to InvoiceData format
 */
export function formatOrderForInvoiceREST(order: WooCommerceOrder | MongoOrder): InvoiceData | null {
  // Check if it's MongoDB order format (has items array directly)
  if ('items' in order && Array.isArray(order.items)) {
    return formatMongoOrderForInvoice(order as MongoOrder);
  }
  
  // Otherwise, treat as WooCommerce format
  const wcOrder = order as WooCommerceOrder;
  if (!wcOrder || !wcOrder.id) {
    return null;
  }

  // Format order date
  const orderDate = wcOrder.date_created
    ? new Date(wcOrder.date_created).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Format line items
  const items = wcOrder.line_items?.map((item) => ({
    name: item.name || 'Sản phẩm',
    sku: item.sku || undefined,
    quantity: item.quantity || 0,
    price: item.price || '0',
    total: item.total || '0',
  })) || [];

  // Get payment method title
  const paymentMethod = wcOrder.payment_method_title || wcOrder.payment_method || undefined;

  return {
    orderNumber: wcOrder.number || wcOrder.id.toString(),
    orderDate,
    status: wcOrder.status || '',
    billing: {
      firstName: wcOrder.billing.first_name || '',
      lastName: wcOrder.billing.last_name || '',
      email: wcOrder.billing.email || '',
      phone: wcOrder.billing.phone || '',
      address1: wcOrder.billing.address_1 || '',
      address2: wcOrder.billing.address_2 || undefined,
      city: wcOrder.billing.city || '',
      postcode: wcOrder.billing.postcode || '',
      country: wcOrder.billing.country || 'VN',
    },
    shipping: {
      firstName: wcOrder.shipping.first_name || '',
      lastName: wcOrder.shipping.last_name || '',
      address1: wcOrder.shipping.address_1 || '',
      address2: wcOrder.shipping.address_2 || undefined,
      city: wcOrder.shipping.city || '',
      postcode: wcOrder.shipping.postcode || '',
      country: wcOrder.shipping.country || 'VN',
    },
    items,
    // Calculate subtotal from line items (WooCommerce doesn't provide subtotal directly)
    subtotal: (wcOrder.line_items && wcOrder.line_items.length > 0
      ? wcOrder.line_items.reduce((sum, item) => {
          return sum + parseFloat(item.total || '0');
        }, 0)
      : 0).toString(),
    shippingTotal: wcOrder.shipping_total || '0',
    totalTax: wcOrder.total_tax || '0',
    total: wcOrder.total || '0',
    currency: wcOrder.currency || 'VND',
    paymentMethod,
    customerNote: wcOrder.customer_note || undefined,
  };
}

/**
 * Convert MongoDB Order data to InvoiceData format
 */
function formatMongoOrderForInvoice(order: MongoOrder): InvoiceData | null {
  if (!order || (!order._id && !order.orderNumber)) {
    return null;
  }

  // Format order date
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Format line items
  const items = order.items?.map((item) => ({
    name: item.productName || 'Sản phẩm',
    sku: item.sku || undefined,
    quantity: item.quantity || 0,
    price: typeof item.price === 'number' ? item.price.toString() : (item.price || '0'),
    total: (typeof item.price === 'number' ? item.price * (item.quantity || 0) : parseFloat(item.price || '0') * (item.quantity || 0)).toString(),
  })) || [];

  // Get payment method title
  const paymentMethod = order.paymentMethodTitle || order.paymentMethod || undefined;

  return {
    orderNumber: order.orderNumber || order._id?.toString() || '',
    orderDate,
    status: order.status || '',
    billing: {
      firstName: order.billing?.firstName || '',
      lastName: order.billing?.lastName || '',
      email: order.billing?.email || '',
      phone: order.billing?.phone || '',
      address1: order.billing?.address1 || '',
      address2: order.billing?.address2 || undefined,
      city: order.billing?.city || '',
      postcode: order.billing?.postcode || '',
      country: order.billing?.country || 'VN',
    },
    shipping: {
      firstName: order.shipping?.firstName || '',
      lastName: order.shipping?.lastName || '',
      address1: order.shipping?.address1 || '',
      address2: order.shipping?.address2 || undefined,
      city: order.shipping?.city || '',
      postcode: order.shipping?.postcode || '',
      country: order.shipping?.country || 'VN',
    },
    items,
    subtotal: typeof order.subtotal === 'number' ? order.subtotal.toString() : (order.subtotal || '0'),
    shippingTotal: typeof order.shippingTotal === 'number' ? order.shippingTotal.toString() : (order.shippingTotal || '0'),
    totalTax: '0', // MongoDB orders may not have tax field
    total: typeof order.total === 'number' ? order.total.toString() : (order.total || '0'),
    currency: 'VND',
    paymentMethod,
    customerNote: order.customerNote || undefined,
  };
}

