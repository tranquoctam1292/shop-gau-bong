'use client';

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
                      options: terms.map((term: any) => term.name || term.slug).filter(Boolean),
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
      const allProducts: any[] = [];
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

      allProducts.forEach((product: any, index: number) => {
        // Priority 1: Extract từ attributes array (mapped products từ API)
        // Mapped products từ mapMongoProduct có attributes array với options
        if (product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0) {
          productsWithVariants++;
          
          if (process.env.NODE_ENV === 'development' && index < 3) {
            console.log(`[useProductAttributes] Product ${index + 1} has attributes:`, {
              productName: product.name,
              attributesCount: product.attributes.length,
              attributes: product.attributes,
            });
          }
          
          product.attributes.forEach((attr: any) => {
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
                
                if (process.env.NODE_ENV === 'development' && index < 3) {
                  console.log(`[useProductAttributes] Extracted from ${product.name}:`, {
                    originalName: attr.name,
                    attrName,
                    normalizedName,
                    isSize,
                    isColor,
                    isMaterial,
                    optionsCount: attr.options.length,
                    options: attr.options,
                  });
                }
              }
            }
          });
        } else if (process.env.NODE_ENV === 'development' && index < 3) {
          console.log(`[useProductAttributes] Product ${index + 1} has NO attributes:`, {
            productName: product.name,
            hasAttributes: !!product.attributes,
            attributesType: typeof product.attributes,
            attributesIsArray: Array.isArray(product.attributes),
            attributesLength: product.attributes?.length,
            hasVariants: !!product.variants,
            variantsLength: product.variants?.length,
          });
        }
        
        // Priority 2: Fallback - Extract từ variants array (nếu API trả về raw MongoDB data)
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          product.variants.forEach((variant: any) => {
            // Extract size
            if (variant.size && typeof variant.size === 'string' && variant.size.trim()) {
              const attrName = 'pa_size';
              if (!attributesMap.has(attrName)) {
                attributesMap.set(attrName, new Set<string>());
              }
              attributesMap.get(attrName)!.add(variant.size.trim());
              totalAttributesFound++;
            }
            
            // Extract color
            if (variant.color && typeof variant.color === 'string' && variant.color.trim()) {
              const attrName = 'pa_color';
              if (!attributesMap.has(attrName)) {
                attributesMap.set(attrName, new Set<string>());
              }
              attributesMap.get(attrName)!.add(variant.color.trim());
              totalAttributesFound++;
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
          totalAttributesFound++;
        }
      });

      // Debug logging - Chi tiết hơn để debug
      if (process.env.NODE_ENV === 'development') {
        const sampleProduct = allProducts[0];
        console.log('[useProductAttributes] Extracted attributes:', {
          totalProducts: allProducts.length,
          productsWithVariants,
          totalAttributesFound,
          attributesMap: Array.from(attributesMap.entries()).map(([name, options]) => ({
            name,
            optionsCount: options.size,
            options: Array.from(options).slice(0, 5), // First 5 options
          })),
          sampleProduct: sampleProduct ? {
            id: sampleProduct.id,
            name: sampleProduct.name,
            hasAttributes: !!sampleProduct.attributes,
            attributesCount: sampleProduct.attributes?.length || 0,
            attributes: sampleProduct.attributes,
            hasVariants: !!sampleProduct.variants,
            variantsCount: sampleProduct.variants?.length || 0,
            variants: sampleProduct.variants?.slice(0, 2), // First 2 variants
            type: sampleProduct.type,
          } : null,
          // Check first 3 products for attributes
          firstThreeProducts: allProducts.slice(0, 3).map((p: any) => ({
            id: p.id,
            name: p.name,
            hasAttributes: !!p.attributes,
            attributesCount: p.attributes?.length || 0,
            attributes: p.attributes,
            hasVariants: !!p.variants,
            variantsCount: p.variants?.length || 0,
          })),
        });
      }

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

