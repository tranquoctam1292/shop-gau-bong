/**
 * Invoice Utility Functions for REST API
 * Helper functions để format WooCommerce REST API order data cho PDF invoice
 */

import type { WooCommerceOrder } from '@/types/woocommerce';

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

/**
 * Convert WooCommerce REST API Order data to InvoiceData format
 */
export function formatOrderForInvoiceREST(order: WooCommerceOrder): InvoiceData | null {
  if (!order || !order.id) {
    return null;
  }

  // Format order date
  const orderDate = order.date_created
    ? new Date(order.date_created).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Format line items
  const items = order.line_items?.map((item) => ({
    name: item.name || 'Sản phẩm',
    sku: item.sku || undefined,
    quantity: item.quantity || 0,
    price: item.price || '0',
    total: item.total || '0',
  })) || [];

  // Get payment method title
  const paymentMethod = order.payment_method_title || order.payment_method || undefined;

  return {
    orderNumber: order.number || order.id.toString(),
    orderDate,
    status: order.status || '',
    billing: {
      firstName: order.billing.first_name || '',
      lastName: order.billing.last_name || '',
      email: order.billing.email || '',
      phone: order.billing.phone || '',
      address1: order.billing.address_1 || '',
      address2: order.billing.address_2 || undefined,
      city: order.billing.city || '',
      postcode: order.billing.postcode || '',
      country: order.billing.country || 'VN',
    },
    shipping: {
      firstName: order.shipping.first_name || '',
      lastName: order.shipping.last_name || '',
      address1: order.shipping.address_1 || '',
      address2: order.shipping.address_2 || undefined,
      city: order.shipping.city || '',
      postcode: order.shipping.postcode || '',
      country: order.shipping.country || 'VN',
    },
    items,
    // Calculate subtotal from line items (WooCommerce doesn't provide subtotal directly)
    subtotal: (order.line_items && order.line_items.length > 0
      ? order.line_items.reduce((sum, item) => {
          return sum + parseFloat(item.total || '0');
        }, 0)
      : 0).toString(),
    shippingTotal: order.shipping_total || '0',
    totalTax: order.total_tax || '0',
    total: order.total || '0',
    currency: order.currency || 'VND',
    paymentMethod,
    customerNote: order.customer_note || undefined,
  };
}

