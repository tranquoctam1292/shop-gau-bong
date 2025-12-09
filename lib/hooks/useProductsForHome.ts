'use client';

import { useState, useEffect } from 'react';
import { mapWooCommerceProducts, type MappedProduct } from '@/lib/utils/productMapper';

interface UseProductsForHomeOptions {
  featured?: boolean;
  orderby?: 'date' | 'popularity' | 'price' | 'title';
  order?: 'asc' | 'desc';
  per_page?: number;
  // Custom filters (server-side filtering)
  min_length?: number; // Minimum length in cm (for bigsize products)
  max_length?: number; // Maximum length in cm
  material?: string; // Material filter
}

/**
 * Hook để fetch products cho homepage sections
 * Đơn giản hơn useProductsREST, không dùng filters từ URL
 */
export function useProductsForHome(options: UseProductsForHomeOptions = {}) {
  const { featured, orderby = 'date', order = 'desc', per_page = 8 } = options;
  const [products, setProducts] = useState<MappedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        // Build API params
        const params: Record<string, string> = {
          per_page: per_page.toString(),
          status: 'publish',
          orderby: orderby,
          order: order,
        };

        // Featured filter (WooCommerce REST API)
        if (featured) {
          params.featured = 'true';
        }

        // Custom filters (server-side filtering)
        if (options.min_length !== undefined) {
          params.min_length = options.min_length.toString();
        }
        if (options.max_length !== undefined) {
          params.max_length = options.max_length.toString();
        }
        if (options.material) {
          params.material = options.material;
        }

        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`/api/woocommerce/products?${queryString}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();
        const productsData = data.products || [];
        
        // Map products
        const mappedProducts = mapWooCommerceProducts(productsData);
        setProducts(mappedProducts);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch products'));
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [featured, orderby, order, per_page, options.min_length, options.max_length, options.material]);

  return {
    products,
    loading,
    error,
  };
}

