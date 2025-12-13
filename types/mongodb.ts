/**
 * MongoDB Type Definitions
 * 
 * Types for MongoDB documents used in Custom CMS
 * 
 * These types represent the actual structure of documents in MongoDB,
 * as opposed to WooCommerce REST API types which are kept for backward compatibility.
 * 
 * @see docs/SCHEMA_CONTEXT.md for detailed schema documentation
 */

/**
 * MongoDB Order Type
 * 
 * Represents an order document in MongoDB
 */
export interface MongoOrder {
  _id?: any; // ObjectId
  orderNumber?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  status?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentMethodTitle?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  billing?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  shipping?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  items?: Array<{
    productId?: string;
    variationId?: string;
    productName?: string;
    sku?: string;
    quantity?: number;
    price?: number | string;
  }>;
  subtotal?: number | string;
  shippingTotal?: number | string;
  total?: number | string;
  totalTax?: number | string;
  currency?: string;
  customerNote?: string;
  paymentMetadata?: Record<string, any>;
  paidAt?: Date | string;
  completedAt?: Date | string;
  cancelledAt?: Date | string;
}

/**
 * MongoDB Product Variant Type
 * 
 * Represents a product variant in MongoDB
 * Note: MongoDB variants use direct `size` and `color` fields, NOT an `attributes` object
 */
export interface MongoVariant {
  id?: string;
  size: string;
  color?: string;
  colorCode?: string;
  price: number;
  stock?: number;
  stockQuantity?: number;
  image?: string;
  sku?: string;
}

/**
 * Frontend Order Type (Compatible with both WooCommerce and MongoDB formats)
 * 
 * This type is used by hooks and components that need to work with orders
 * from either WooCommerce REST API (legacy) or MongoDB CMS API (current)
 */
export type Order = {
  id: string | number;
  number?: string;
  orderNumber?: string;
  status: string;
  payment_method?: string;
  paymentMethod?: string;
  payment_method_title?: string;
  paymentMethodTitle?: string;
  date_created?: string;
  createdAt?: Date | string;
  billing: {
    first_name?: string;
    firstName?: string;
    last_name?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address_1?: string;
    address1?: string;
    address_2?: string;
    address2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  shipping: {
    first_name?: string;
    firstName?: string;
    last_name?: string;
    lastName?: string;
    address_1?: string;
    address1?: string;
    address_2?: string;
    address2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  line_items?: Array<{
    id?: number | string;
    product_id?: number | string;
    productId?: string;
    variation_id?: number | string;
    variationId?: string;
    name?: string;
    productName?: string;
    quantity?: number;
    price?: string | number;
    total?: string | number;
    sku?: string;
  }>;
  items?: Array<{
    productId?: string;
    variationId?: string;
    productName?: string;
    sku?: string;
    quantity?: number;
    price?: number | string;
  }>;
  subtotal?: string | number;
  shipping_total?: string | number;
  shippingTotal?: string | number;
  total?: string | number;
  total_tax?: string | number;
  totalTax?: string | number;
  currency?: string;
  customer_note?: string;
  customerNote?: string;
  [key: string]: any; // Allow additional fields for compatibility
};
