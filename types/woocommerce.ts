/**
 * WooCommerce REST API Type Definitions
 * 
 * Based on WooCommerce REST API v3 documentation
 * https://woocommerce.github.io/woocommerce-rest-api-docs/
 * 
 * Note: ACF (Advanced Custom Fields) sẽ nằm trong `meta_data` array
 * với key như 'length', 'width', 'height', 'volumetric_weight'
 */

/**
 * WooCommerce Product Type
 * 
 * @see https://woocommerce.github.io/woocommerce-rest-api-docs/#products
 */
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_from_gmt: string | null;
  date_on_sale_to: string | null;
  date_on_sale_to_gmt: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: any[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    options: string[];
    position: number;
    visible: boolean;
    variation: boolean;
  }>;
  default_attributes: any[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  price_html: string;
  related_ids: number[];
  meta_data: Array<{
    id: number;
    key: string;
    value: string | number | object | null;
  }>;
  // ACF fields sẽ nằm trong meta_data với keys:
  // - 'length' (number)
  // - 'width' (number)
  // - 'height' (number)
  // - 'volumetric_weight' (number)
  // - 'material' (string)
  // - 'origin' (string)
}

/**
 * WooCommerce Category Type
 * 
 * @see https://woocommerce.github.io/woocommerce-rest-api-docs/#product-categories
 */
export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: 'default' | 'products' | 'subcategories' | 'both';
  image: {
    id: number;
    src: string;
    name: string;
    alt: string;
  } | null;
  menu_order: number;
  count: number;
}

/**
 * WooCommerce Order Type
 * 
 * @see https://woocommerce.github.io/woocommerce-rest-api-docs/#orders
 */
export interface WooCommerceOrder {
  id: number;
  parent_id: number;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  currency: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  order_key: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string | null;
  date_paid_gmt: string | null;
  date_completed: string | null;
  date_completed_gmt: string | null;
  cart_hash: string;
  meta_data: Array<{
    id: number;
    key: string;
    value: string | number | object | null;
  }>;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string;
    subtotal_tax: string;
    total: string;
    total_tax: string;
    taxes: Array<{
      id: number;
      total: string;
      subtotal: string;
    }>;
    meta_data: Array<{
      id: number;
      key: string;
      value: string | number | object | null;
    }>;
    sku: string;
    price: string;
    image: {
      id: number;
      src: string;
      name: string;
      alt: string;
    } | null;
  }>;
  tax_lines: Array<{
    id: number;
    rate_code: string;
    rate_id: number;
    label: string;
    compound: boolean;
    tax_total: string;
    shipping_tax_total: string;
  }>;
  shipping_lines: Array<{
    id: number;
    method_title: string;
    method_id: string;
    instance_id: string;
    total: string;
    total_tax: string;
    taxes: Array<{
      id: number;
      total: string;
      subtotal: string;
    }>;
    meta_data: Array<{
      id: number;
      key: string;
      value: string | number | object | null;
    }>;
  }>;
  fee_lines: Array<{
    id: number;
    name: string;
    tax_class: string;
    tax_status: 'taxable' | 'none';
    total: string;
    total_tax: string;
    taxes: Array<{
      id: number;
      total: string;
      subtotal: string;
    }>;
    meta_data: Array<{
      id: number;
      key: string;
      value: string | number | object | null;
    }>;
  }>;
  coupon_lines: Array<{
    id: number;
    code: string;
    discount: string;
    discount_tax: string;
    meta_data: Array<{
      id: number;
      key: string;
      value: string | number | object | null;
    }>;
  }>;
  refunds: Array<{
    id: number;
    reason: string;
    total: string;
  }>;
  customer_note: string;
  number: string; // Order number (formatted)
}

/**
 * WooCommerce Order Create Input
 * 
 * Dùng cho createOrder mutation
 */
export interface WooCommerceOrderCreateInput {
  payment_method: string;
  payment_method_title?: string;
  set_paid?: boolean;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    company?: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    company?: string;
  };
  line_items: Array<{
    product_id: number;
    quantity: number;
    variation_id?: number;
  }>;
  shipping_lines?: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
  fee_lines?: Array<{
    name: string;
    total: string;
    tax_class?: string;
  }>;
  coupon_lines?: Array<{
    code: string;
  }>;
  customer_note?: string;
  meta_data?: Array<{
    key: string;
    value: string | number | object;
  }>;
}

/**
 * WooCommerce Order Update Input
 * 
 * Dùng cho updateOrder mutation
 */
export interface WooCommerceOrderUpdateInput {
  status?: WooCommerceOrder['status'];
  customer_note?: string;
  meta_data?: Array<{
    key: string;
    value: string | number | object;
  }>;
  // Có thể update các fields khác tùy theo nhu cầu
}

/**
 * Helper type để extract ACF fields từ Product meta_data
 */
export interface ProductACFFields {
  length?: number;
  width?: number;
  height?: number;
  volumetric_weight?: number;
  material?: string;
  origin?: string;
}

