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
  total?: number | string; // Legacy field (for backward compatibility)
  grandTotal?: number | string; // Final total after tax/shipping/discount
  totalTax?: number | string;
  taxTotal?: number | string;
  discountTotal?: number | string;
  currency?: string;
  customerNote?: string;
  adminNotes?: string;
  cancelledReason?: string;
  paymentMetadata?: Record<string, any>;
  version?: number; // Version field for optimistic locking (starts at 1)
  paidAt?: Date | string;
  completedAt?: Date | string;
  cancelledAt?: Date | string;
  // SECURITY FIX: Double Stock Restoration - Guard flag to prevent duplicate stock restoration
  isStockRestored?: boolean; // Default: false. Set to true when stock has been restored (refunded or cancelled)
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
  sku_normalized?: string; // NEW: Normalized SKU for duplicate checking
  reservedQuantity?: number; // For inventory reservation
}

/**
 * Smart SKU System Types
 */

/**
 * SKU Settings Document
 * Stores SKU generation patterns (global or category-specific)
 */
export interface SkuSetting {
  _id?: any; // ObjectId
  categoryId?: string | null; // null = global pattern, ObjectId = category-specific
  pattern: string; // e.g., "{CATEGORY_CODE}-{PRODUCT_NAME}-{ATTRIBUTE_VALUE}-{INCREMENT}"
  separator: string; // Default: "-"
  caseType: 'UPPER' | 'LOWER'; // Default: 'UPPER'
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SKU Abbreviation Document
 * Stores abbreviation mappings for attributes (colors, sizes, materials, etc.)
 * Note: Category codes are stored in categories.code field, not here
 */
export interface SkuAbbreviation {
  _id?: any; // ObjectId
  type: 'ATTRIBUTE'; // Only ATTRIBUTE (Category code in categories.code)
  originalValue: string; // e.g., "Màu Đỏ", "Xanh Dương", "Size L"
  shortCode: string; // e.g., "DO", "XD", "L"
  categoryId?: string | null; // Optional: category-specific mapping
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SKU Counter Document
 * Atomic sequence counter for {INCREMENT} token
 */
export interface SkuCounter {
  _id?: any; // ObjectId
  key: string; // e.g., "CAT-ATTR-2025" (base SKU without increment)
  sequence: number; // Current sequence number
  updatedAt: Date;
}

/**
 * SKU History Document
 * Audit log for SKU changes (for order lookup, SEO redirect, debugging)
 */
export interface SkuHistory {
  _id?: any; // ObjectId
  productId: string; // Product ObjectId
  variantId?: string; // Variant ID (if variant SKU changed)
  oldSku: string; // Previous SKU
  newSku: string; // New SKU
  patternUsed?: string; // Pattern used to generate new SKU (for debugging)
  reason: 'regenerate' | 'manual' | 'bulk_import'; // Reason for change
  changedBy?: string; // Admin user ID
  changedAt: Date;
}

/**
 * Contact Widget Settings Document
 * Stores configuration for Floating Contact Widget (Hotline, Zalo, Messenger)
 */
export interface ContactWidgetConfig {
  _id?: any; // ObjectId
  enabled: boolean;
  position: 'left' | 'right';
  primaryColor: string; // Hex color code (e.g., "#D6336C")
  items: Array<{
    type: 'hotline' | 'zalo' | 'messenger';
    active: boolean;
    label: string; // Display label (e.g., "Gọi ngay", "Chat Zalo")
    value: string; // Phone number (for hotline/zalo) or Page ID (for messenger)
    iconUrl?: string; // Optional custom SVG icon URL (for Zalo/Messenger)
  }>;
  createdAt: Date;
  updatedAt: Date;
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
