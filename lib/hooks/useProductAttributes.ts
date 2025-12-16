'use client';

import { useQuery } from '@tanstack/react-query';
import type { MappedProduct } from '@/lib/utils/productMapper';

/**
 * Product Attributes từ WooCommerce
 */
export interface ProductAttribute {
  name: string;        // e.g., 'pa_size', 'pa_color', 'pa_material'
  slug: string;        // e.g., 'pa-size', 'pa-color', 'pa-material'
  options: string[];   // Unique options từ tất cả products
}

/**
 * Global Attribute Term Type
 */
interface GlobalAttributeTerm {
  id: string;
  name: string;
  slug: string;
}

/**
 * Global Attribute Type
 */
interface GlobalAttribute {
  id: string;
  name: string;
  slug: string;
  terms?: GlobalAttributeTerm[];
}

/**
 * Hook để fetch và cache product attributes từ CMS
 * 
 * Priority 1: Fetch từ /api/cms/attributes (global attributes)
 * Priority 2: Fallback - Extract từ products nếu API không có data
 * Cache trong React Query để tránh fetch nhiều lần
 */
export function useProductAttributes() {
  const { data: attributes, isLoading, error } = useQuery({
    queryKey: ['product-attributes'],
    queryFn: async (): Promise<ProductAttribute[]> => {
      // Priority 1: Try to fetch from global attributes API
      try {
        const attributesResponse = await fetch('/api/cms/attributes');
        if (attributesResponse.ok) {
          const attributesData = await attributesResponse.json();
          const globalAttributes = attributesData.attributes || [];
          
          // Fetch terms for each attribute
          const attributesWithTerms: ProductAttribute[] = [];
          
          for (const attr of globalAttributes) {
            // Only fetch size, color, material attributes
            const attrSlug = attr.slug?.toLowerCase() || attr.name?.toLowerCase() || '';
            if (attrSlug.includes('size') || attrSlug.includes('color') || attrSlug.includes('material')) {
              try {
                const termsResponse = await fetch(`/api/cms/attributes?attributeId=${attr.id || attr.slug}`);
                if (termsResponse.ok) {
                  const termsData = await termsResponse.json();
                  const terms = termsData.terms || [];
                  
                  if (terms.length > 0) {
                    attributesWithTerms.push({
                      name: attr.name || attrSlug,
                      slug: attr.slug || attrSlug,
                      options: terms.map((term: GlobalAttributeTerm) => term.name || term.slug).filter(Boolean),
                    });
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch terms for attribute ${attr.id}:`, err);
              }
            }
          }
          
          // If we got attributes from global API, return them
          if (attributesWithTerms.length > 0) {
            return attributesWithTerms;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch from global attributes API, falling back to products:', err);
      }
      
      // Priority 2: Fallback - Extract from products
      // Fetch multiple pages to get all attributes
      const allProducts: MappedProduct[] = [];
      let page = 1;
      let hasMore = true;
      const maxPages = 10; // Limit to prevent infinite loop
      
      while (hasMore && page <= maxPages) {
        const response = await fetch(`/api/cms/products?per_page=100&page=${page}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products for attributes');
        }

        const data = await response.json();
        const products = data.products || [];
        allProducts.push(...products);
        
        hasMore = data.pagination?.hasNextPage || false;
        page++;
      }

      // Extract unique attributes từ tất cả products
      // MongoDB products có variants với size và color trực tiếp (KHÔNG có attributes object)
      const attributesMap = new Map<string, Set<string>>();
      let productsWithVariants = 0;
      let totalAttributesFound = 0;

      allProducts.forEach((product: MappedProduct) => {
        // Priority 1: Extract từ attributes array (mapped products từ API)
        // Mapped products từ mapMongoProduct có attributes array với options
        if (product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0) {
          productsWithVariants++;
          
          product.attributes.forEach((attr) => {
            if (attr.name && attr.options && Array.isArray(attr.options)) {
              const attrName = attr.name.toLowerCase();
              
              // Match attributes: hỗ trợ cả tiếng Anh và tiếng Việt
              // Size: 'pa_size', 'size', 'kích thước'
              // Color: 'pa_color', 'color', 'màu sắc', 'màu'
              // Material: 'pa_material', 'material', 'chất liệu'
              const isSize = attrName.startsWith('pa_size') || 
                            attrName === 'size' || 
                            attrName.includes('kích thước') ||
                            attrName.includes('kich thuoc');
              const isColor = attrName.startsWith('pa_color') || 
                             attrName === 'color' || 
                             attrName.includes('màu sắc') ||
                             attrName.includes('mau sac') ||
                             attrName === 'màu';
              const isMaterial = attrName.startsWith('pa_material') || 
                                attrName === 'material' || 
                                attrName.includes('chất liệu') ||
                                attrName.includes('chat lieu');
              
              if (isSize || isColor || isMaterial) {
                // Normalize attribute name để consistent
                let normalizedName: string;
                if (isSize) {
                  normalizedName = 'pa_size';
                } else if (isColor) {
                  normalizedName = 'pa_color';
                } else if (isMaterial) {
                  normalizedName = 'pa_material';
                } else {
                  // Fallback: giữ nguyên hoặc normalize
                  normalizedName = attrName.startsWith('pa_') ? attrName : `pa_${attrName}`;
                }
                
                if (!attributesMap.has(normalizedName)) {
                  attributesMap.set(normalizedName, new Set<string>());
                }
                
                // Add all options
                attr.options.forEach((option: string) => {
                  if (option && option.trim()) {
                    attributesMap.get(normalizedName)!.add(option.trim());
                    totalAttributesFound++;
                  }
                });
              }
            }
          });
        }
        
        // Note: MappedProduct không có variants property trực tiếp
        // Variants được extract từ attributes array ở Priority 1
        // Nếu cần extract từ raw MongoDB variants, cần fetch raw data từ API trước khi map

        // Nếu product có material field trực tiếp (từ MongoDB)
        if (product.material) {
          const attrName = 'pa_material';
          if (!attributesMap.has(attrName)) {
            attributesMap.set(attrName, new Set<string>());
          }
          attributesMap.get(attrName)!.add(String(product.material).trim());
          totalAttributesFound++;
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
    staleTime: 5 * 60 * 1000, // Cache 5 phút (giảm từ 10 phút để refresh nhanh hơn)
    gcTime: 30 * 60 * 1000, // Keep in cache 30 phút
    retry: 2, // Retry 2 lần nếu fail
    refetchOnWindowFocus: true, // Refetch khi focus window
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
    const options = sizeAttr?.options || [];
    
    // Debug logging
    if (process.env.NODE_ENV === 'development' && options.length === 0 && !isLoading) {
      console.warn('[useProductAttributes] No size options found. Available attributes:', 
        attributes?.map(attr => ({ name: attr.name, slug: attr.slug, optionsCount: attr.options.length }))
      );
    }
    
    return options;
  };

  const getColorOptions = (): string[] => {
    const colorAttr = getAttributeByName('color') || getAttributeByName('pa_color');
    const options = colorAttr?.options || [];
    
    // Debug logging
    if (process.env.NODE_ENV === 'development' && options.length === 0 && !isLoading) {
      console.warn('[useProductAttributes] No color options found. Available attributes:', 
        attributes?.map(attr => ({ name: attr.name, slug: attr.slug, optionsCount: attr.options.length }))
      );
    }
    
    return options;
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

