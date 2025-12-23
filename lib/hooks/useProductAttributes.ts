'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Product Attributes từ Global Attributes System
 */
export interface ProductAttribute {
  name: string;        // e.g., 'pa_size', 'pa_color', 'pa_material'
  slug: string;        // e.g., 'pa-size', 'pa-color', 'pa-material'
  options: string[];   // Unique options từ global attributes
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
 * Chỉ sử dụng API /api/cms/attributes (Global Attributes System).
 * Nếu API trống hoặc lỗi, trả về empty array.
 * 
 * ⚠️ CRITICAL: Không còn fallback fetch products để tránh:
 * - Tải trọng cực lớn lên server (fetch 10 trang × 100 sản phẩm = 1000 sản phẩm)
 * - Treo trình duyệt khi xử lý hàng nghìn object trong main thread
 * 
 * Nếu attributes trống, Admin phải cấu hình trong hệ thống PIM.
 * 
 * Cache trong React Query để tránh fetch nhiều lần.
 */
export function useProductAttributes() {
  const { data: attributes, isLoading, error } = useQuery({
    queryKey: ['product-attributes'],
    queryFn: async (): Promise<ProductAttribute[]> => {
      try {
        const attributesResponse = await fetch('/api/cms/attributes');
        
        if (!attributesResponse.ok) {
          // API lỗi, trả về empty array thay vì fallback
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useProductAttributes] API /api/cms/attributes returned error:', attributesResponse.status);
          }
          return [];
        }

          const attributesData = await attributesResponse.json();
          const globalAttributes = attributesData.attributes || [];
        
        // Nếu không có attributes, trả về empty array
        if (globalAttributes.length === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useProductAttributes] No attributes found in API. Admin should configure attributes in PIM system.');
          }
          return [];
        }
          
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
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[useProductAttributes] Failed to fetch terms for attribute ${attr.id}:`, err);
              }
            }
          }
        }
        
        // Trả về attributes từ global API (có thể là empty array nếu không có terms)
        return attributesWithTerms;
      } catch (err) {
        // API lỗi hoặc network error, trả về empty array
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useProductAttributes] Failed to fetch from global attributes API:', err);
          console.warn('[useProductAttributes] Admin should configure attributes in PIM system.');
        }
        return [];
      }
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

