'use client';

import { useState, useEffect } from 'react';
import { mapWooCommerceProduct, type MappedProduct } from '@/lib/utils/productMapper';

/**
 * Hook để fetch single product từ WooCommerce REST API
 * 
 * @param id - Product ID (number) hoặc slug (string)
 * @param idType - 'id' hoặc 'slug' (default: 'id')
 * @returns Product, loading, error
 */
export function useProductREST(id: string | number | null | undefined, idType: 'id' | 'slug' = 'id') {
  const [product, setProduct] = useState<MappedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let productData;

        if (idType === 'slug') {
          // REST API không có endpoint trực tiếp để get by slug
          // Cần search products với slug qua API route
          const response = await fetch(`/api/woocommerce/products?slug=${encodeURIComponent(String(id))}&per_page=1`);
          if (!response.ok) {
            throw new Error('Product not found');
          }
          const data = await response.json();
          if (!data.products || data.products.length === 0) {
            throw new Error('Product not found');
          }
          productData = data.products[0];
        } else {
          // Get by ID qua API route
          const productId = typeof id === 'string' ? parseInt(id, 10) : id;
          if (isNaN(productId)) {
            throw new Error('Invalid product ID');
          }
          const response = await fetch(`/api/woocommerce/products/${productId}`);
          if (!response.ok) {
            throw new Error('Product not found');
          }
          const data = await response.json();
          productData = data.product;
        }

        // Map product sang frontend format
        const mappedProduct = mapWooCommerceProduct(productData);
        setProduct(mappedProduct);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch product'));
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id, idType]);

  return {
    product,
    loading,
    error,
  };
}

