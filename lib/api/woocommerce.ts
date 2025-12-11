/**
 * WooCommerce REST API Client
 * 
 * Base URL: /wp-json/wc/v3/
 * Authentication: Consumer Key & Consumer Secret (Basic Auth)
 * 
 * Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/
 */

const WOOCOMMERCE_API_BASE = 
  (process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost/wordpress') + '/wp-json/wc/v3';
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || '';

// Alternative: WordPress Application Password
const WP_USERNAME = process.env.WORDPRESS_USERNAME || '';
const WP_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD || '';

/**
 * Helper function để tạo Basic Auth header
 * 
 * Supports 2 methods:
 * 1. WooCommerce REST API key (Consumer Key/Secret)
 * 2. WordPress Application Password (Username/Password)
 */
function getAuthHeader(): string {
  // Method 1: WooCommerce REST API key (preferred)
  if (CONSUMER_KEY && CONSUMER_SECRET) {
    const credentials = typeof Buffer !== 'undefined' 
      ? Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
      : btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    return `Basic ${credentials}`;
  }
  
  // Method 2: WordPress Application Password (fallback)
  if (WP_USERNAME && WP_APP_PASSWORD) {
    // Application password format: "xxxx xxxx xxxx xxxx xxxx xxxx" -> remove spaces
    const cleanPassword = WP_APP_PASSWORD.replace(/\s+/g, '');
    const credentials = typeof Buffer !== 'undefined'
      ? Buffer.from(`${WP_USERNAME}:${cleanPassword}`).toString('base64')
      : btoa(`${WP_USERNAME}:${cleanPassword}`);
    return `Basic ${credentials}`;
  }
  
  throw new Error(
    'WooCommerce REST API credentials are not configured. ' +
    'Please set either:\n' +
    '  - WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET, OR\n' +
    '  - WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD\n' +
    'in your environment variables.'
  );
}

/**
 * Generic fetch function cho WooCommerce REST API
 * 
 * @param endpoint - API endpoint (ví dụ: '/products', '/orders')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise với response data
 */
async function wcFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${WOOCOMMERCE_API_BASE}${endpoint}`;
  
  try {
    // Debug: Log authentication (không log credentials trong production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[WooCommerce API] Fetching:', url);
      console.log('[WooCommerce API] Auth header present:', !!getAuthHeader());
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `WooCommerce API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
        
        // Log chi tiết cho 401 errors
        if (response.status === 401) {
          console.error('[WooCommerce API] 401 Unauthorized:', {
            code: errorJson.code,
            message: errorJson.message,
            endpoint: url,
            hint: 'Check API key permissions (must be Read/Write) and credentials in .env.local',
          });
        }
        
        // Log chi tiết cho 403 errors
        if (response.status === 403) {
          console.error('[WooCommerce API] 403 Forbidden:', {
            code: errorJson.code,
            message: errorJson.message,
            endpoint: url,
            hint: 'API key credentials are correct but missing permissions. Check API key has Read/Write permissions in WooCommerce > Settings > Advanced > REST API. Also check if security plugins are blocking REST API requests.',
          });
        }
      } catch {
        // Nếu không parse được JSON, dùng errorText
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Handle empty response (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while fetching from WooCommerce API');
  }
}

/**
 * Generic fetch function với headers (for pagination)
 * 
 * @param endpoint - API endpoint
 * @param options - Fetch options
 * @returns Promise với response data và headers
 */
async function wcFetchWithHeaders<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data: T; headers: Headers }> {
  const url = `${WOOCOMMERCE_API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `WooCommerce API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Handle empty response (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { data: {} as T, headers: response.headers };
    }

    const data = await response.json();
    return { data, headers: response.headers };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while fetching from WooCommerce API');
  }
}

/**
 * WooCommerce REST API Client
 * 
 * Cung cấp các methods để interact với WooCommerce REST API
 */
export const wcApi = {
  // ============================================
  // PRODUCTS
  // ============================================
  
  /**
   * Get products với filters và pagination
   * 
   * @param params - Query parameters (per_page, page, category, search, orderby, order, etc.)
   * @param includeHeaders - Nếu true, trả về cả headers (for pagination)
   * @returns Array of products hoặc object với data và headers
   * 
   * @example
   * ```typescript
   * const products = await wcApi.getProducts({ per_page: 10, page: 1, category: 'gau-bong' });
   * const { data, headers } = await wcApi.getProducts({ per_page: 10, page: 1 }, true);
   * ```
   */
  getProducts: (params?: Record<string, any>, includeHeaders?: boolean) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    if (includeHeaders) {
      return wcFetchWithHeaders<any[]>(endpoint);
    }
    return wcFetch<any[]>(endpoint);
  },

  /**
   * Get single product by ID
   * 
   * @param id - Product ID
   * @returns Product object
   */
  getProduct: (id: number) => wcFetch<any>(`/products/${id}`),

  /**
   * Get product variations
   * 
   * @param productId - Product ID
   * @returns Array of variation objects
   */
  getProductVariations: (productId: number) => wcFetch<any[]>(`/products/${productId}/variations`),

  /**
   * Search products
   * 
   * @param search - Search term
   * @param params - Additional query parameters
   * @returns Array of products matching search term
   */
  searchProducts: (search: string, params?: Record<string, any>) => {
    const queryParams = { search: encodeURIComponent(search), ...params };
    return wcApi.getProducts(queryParams);
  },

  // ============================================
  // CATEGORIES
  // ============================================
  
  /**
   * Get product categories
   * 
   * @param params - Query parameters (per_page, page, orderby, order, etc.)
   * @returns Array of categories
   */
  getCategories: (params?: Record<string, any>) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    const endpoint = queryString ? `/products/categories?${queryString}` : '/products/categories';
    return wcFetch<any[]>(endpoint);
  },

  /**
   * Get single category by ID
   * 
   * @param id - Category ID
   * @returns Category object
   */
  getCategory: (id: number) => wcFetch<any>(`/products/categories/${id}`),

  // ============================================
  // ORDERS
  // ============================================
  
  /**
   * Create new order
   * 
   * @param data - Order data (billing, shipping, line_items, payment_method, etc.)
   * @returns Created order object
   */
  createOrder: (data: any) => 
    wcFetch<any>('/orders', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),

  /**
   * Get single order by ID
   * 
   * @param id - Order ID
   * @returns Order object
   */
  getOrder: (id: number) => wcFetch<any>(`/orders/${id}`),

  /**
   * Update order
   * 
   * @param id - Order ID
   * @param data - Order data to update
   * @returns Updated order object
   */
  updateOrder: (id: number, data: any) => 
    wcFetch<any>(`/orders/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),

  /**
   * Get orders với filters và pagination
   * 
   * @param params - Query parameters (per_page, page, status, customer, etc.)
   * @returns Array of orders
   */
  getOrders: (params?: Record<string, any>) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    return wcFetch<any[]>(endpoint);
  },

  // ============================================
  // CART
  // ============================================
  // Note: WooCommerce REST API không có cart endpoint
  // Cart sẽ tiếp tục dùng local storage như hiện tại
  // Hoặc có thể dùng WooCommerce Session API (nếu cần)
};

/**
 * Helper function để extract ACF fields từ meta_data
 * 
 * @param metaData - Array of meta_data objects từ WooCommerce product/order
 * @param key - Meta key to find
 * @returns Meta value hoặc undefined
 */
export function getMetaValue(metaData: Array<{ key: string; value: any }>, key: string): any {
  const meta = metaData?.find(m => m.key === key);
  return meta?.value;
}

/**
 * Helper function để extract multiple ACF fields từ meta_data
 * 
 * @param metaData - Array of meta_data objects
 * @param keys - Array of keys to extract
 * @returns Object với keys và values
 */
export function getMetaValues(
  metaData: Array<{ key: string; value: any }>, 
  keys: string[]
): Record<string, any> {
  const result: Record<string, any> = {};
  keys.forEach(key => {
    result[key] = getMetaValue(metaData, key);
  });
  return result;
}

