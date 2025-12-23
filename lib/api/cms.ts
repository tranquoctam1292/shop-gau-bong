/**
 * Custom CMS API Client
 * 
 * Replaces lib/api/woocommerce.ts
 * Calls Next.js API routes instead of WooCommerce REST API
 */

/**
 * Products API
 */
export const cmsApi = {
  /**
   * Get products list
   */
  getProducts: async (params?: Record<string, any>) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    const url = queryString 
      ? `/api/cms/products?${queryString}`
      : '/api/cms/products';
    
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch products');
    }
    
    return response.json();
  },

  /**
   * Get single product by ID or slug
   */
  getProduct: async (id: number | string) => {
    const response = await fetch(`/api/cms/products/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch product');
    }
    return response.json();
  },

  /**
   * Get product variations
   */
  getProductVariations: async (productId: number | string) => {
    const response = await fetch(`/api/cms/products/${productId}/variations`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch variations');
    }
    return response.json();
  },

  /**
   * Search products
   */
  searchProducts: async (search: string, params?: Record<string, any>) => {
    const queryParams = { search: encodeURIComponent(search), ...params };
    return cmsApi.getProducts(queryParams);
  },

  /**
   * Get categories
   */
  getCategories: async (params?: Record<string, any>) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    const url = queryString 
      ? `/api/cms/categories?${queryString}`
      : '/api/cms/categories';
    
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch categories');
    }
    
    return response.json();
  },

  /**
   * Get single category by ID or slug
   */
  getCategory: async (id: number | string) => {
    const response = await fetch(`/api/cms/categories/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch category');
    }
    return response.json();
  },
};

