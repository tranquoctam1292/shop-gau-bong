'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Product Attributes từ WooCommerce
 */
export interface ProductAttribute {
  name: string;        // e.g., 'pa_size', 'pa_color', 'pa_material'
  slug: string;        // e.g., 'pa-size', 'pa-color', 'pa-material'
  options: string[];   // Unique options từ tất cả products
}

/**
 * Hook để fetch và cache product attributes từ WooCommerce
 * 
 * Lấy attributes từ tất cả products và extract unique options
 * Cache trong React Query để tránh fetch nhiều lần
 */
export function useProductAttributes() {
  const { data: attributes, isLoading, error } = useQuery({
    queryKey: ['product-attributes'],
    queryFn: async (): Promise<ProductAttribute[]> => {
      // Fetch một số lượng lớn products để lấy đủ attributes
      // CMS API có limit per_page = 100
      const response = await fetch('/api/cms/products?per_page=100&page=1');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products for attributes');
      }

      const data = await response.json();
      // CMS API trả về { products: [...], pagination: {...} }
      const products = data.products || [];

      // Extract unique attributes từ tất cả products
      const attributesMap = new Map<string, Set<string>>();

      products.forEach((product: any) => {
        // Lấy attributes từ product.attributes (đã được map từ variants)
        if (product.attributes && Array.isArray(product.attributes)) {
          product.attributes.forEach((attr: any) => {
            if (attr.name && attr.options && Array.isArray(attr.options)) {
              const attrName = attr.name.toLowerCase();
              
              // Chỉ lấy attributes quan trọng như 'pa_size', 'pa_color', 'pa_material'
              if (attrName.startsWith('pa_') || 
                  attrName === 'size' || 
                  attrName === 'color' || 
                  attrName === 'material') {
                
                if (!attributesMap.has(attrName)) {
                  attributesMap.set(attrName, new Set<string>());
                }
                
                // Add all options
                attr.options.forEach((option: string) => {
                  if (option && option.trim()) {
                    attributesMap.get(attrName)!.add(option.trim());
                  }
                });
              }
            }
          });
        }

        // Nếu product có material field trực tiếp (từ MongoDB)
        if (product.material) {
          const attrName = 'pa_material';
          if (!attributesMap.has(attrName)) {
            attributesMap.set(attrName, new Set<string>());
          }
          attributesMap.get(attrName)!.add(String(product.material).trim());
        }
      });

      // Convert Map to Array
      const attributesArray: ProductAttribute[] = [];
      attributesMap.forEach((options, name) => {
        attributesArray.push({
          name,
          slug: name.replace(/^pa_/, '').replace(/_/g, '-'),
          options: Array.from(options).sort(), // Sort alphabetically
        });
      });

      return attributesArray;
    },
    staleTime: 10 * 60 * 1000, // Cache 10 phút
    gcTime: 30 * 60 * 1000, // Keep in cache 30 phút
  });

  // Helper functions để lấy attributes theo tên
  const getAttributeByName = (name: string): ProductAttribute | undefined => {
    return attributes?.find(attr => 
      attr.name === name || 
      attr.name === `pa_${name}` ||
      attr.slug === name ||
      attr.slug === name.replace(/_/g, '-')
    );
  };

  const getSizeOptions = (): string[] => {
    const sizeAttr = getAttributeByName('size') || getAttributeByName('pa_size');
    return sizeAttr?.options || [];
  };

  const getColorOptions = (): string[] => {
    const colorAttr = getAttributeByName('color') || getAttributeByName('pa_color');
    return colorAttr?.options || [];
  };

  const getMaterialOptions = (): string[] => {
    const materialAttr = getAttributeByName('material') || getAttributeByName('pa_material');
    return materialAttr?.options || [];
  };

  return {
    attributes: attributes || [],
    isLoading,
    error,
    getAttributeByName,
    getSizeOptions,
    getColorOptions,
    getMaterialOptions,
  };
}

