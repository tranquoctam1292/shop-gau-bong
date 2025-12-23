'use client';

import { useState, useEffect } from 'react';
import { type MappedProduct } from '@/lib/utils/productMapper';

/**
 * Hook để fetch single product từ CMS API
 * 
 * @param id - Product ID (MongoDB ObjectId string) hoặc slug (string)
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

        // CMS API supports both ID (ObjectId) and slug
        const response = await fetch(`/api/cms/products/${encodeURIComponent(String(id))}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        
        const data = await response.json();
        // CMS API đã map product rồi, không cần map lại
        const mappedProduct: MappedProduct = data.product;
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

