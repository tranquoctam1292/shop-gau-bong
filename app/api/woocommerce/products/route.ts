import { NextRequest, NextResponse } from 'next/server';
import { wcApi } from '@/lib/api/woocommerce';

/**
 * API Route: Proxy WooCommerce Products API
 * GET /api/woocommerce/products
 * 
 * Proxy requests từ client đến WooCommerce REST API
 * để bảo mật Consumer Key & Secret
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Convert URLSearchParams to object
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Extract custom filters (not supported by WooCommerce REST API directly)
    const minLength = params.min_length ? parseFloat(params.min_length) : undefined;
    const maxLength = params.max_length ? parseFloat(params.max_length) : undefined;
    const minPrice = params.min_price ? parseFloat(params.min_price) : undefined;
    const maxPrice = params.max_price ? parseFloat(params.max_price) : undefined;
    const material = params.material;
    const size = params.size;
    const color = params.color;

    // Check if we have custom filters that require server-side filtering
    const hasCustomFilters = minLength !== undefined || maxLength !== undefined || 
                            material || minPrice !== undefined || maxPrice !== undefined ||
                            size || color;

    // Remove custom filters from WooCommerce params (they'll be filtered server-side)
    delete params.min_length;
    delete params.max_length;
    delete params.min_price;
    delete params.max_price;
    delete params.material;
    delete params.size;
    delete params.color;

    const originalPerPage = params.per_page ? parseInt(String(params.per_page), 10) : 10;
    const currentPage = params.page ? parseInt(String(params.page), 10) : 1;

    // If we have custom filters, we need to fetch products and filter them
    // Then implement pagination on the filtered results
    // ⚠️ PERFORMANCE NOTE: This approach fetches multiple pages which can be slow
    // For better performance, consider implementing database-level filtering or caching
    if (hasCustomFilters) {
      // Fetch products in batches to filter them
      const allProducts: any[] = [];
      let page = 1;
      const maxPages = 50; // Reduced limit: max 50 pages = 5000 products (reasonable limit)
      const maxProductsToFetch = 2000; // Hard limit: stop after fetching 2000 products
      let hasMore = true;
      const startTime = Date.now();
      const maxExecutionTime = 25000; // 25 seconds timeout (Vercel serverless limit is 30s)

      while (hasMore && page <= maxPages && allProducts.length < maxProductsToFetch) {
        // Check timeout to prevent serverless function timeout
        if (Date.now() - startTime > maxExecutionTime) {
          console.warn(`[Products API] Timeout warning: Fetched ${allProducts.length} products in ${Date.now() - startTime}ms`);
          break;
        }

        const fetchParams = { ...params, per_page: 100, page }; // Fetch 100 per page
        const result = await wcApi.getProducts(fetchParams, true);
        const pageProducts = Array.isArray(result) ? result : result.data;
        const headers = Array.isArray(result) ? new Headers() : result.headers;

        if (pageProducts.length === 0) {
          hasMore = false;
          break;
        }

        allProducts.push(...pageProducts);

        // Check if there are more pages
        const totalPages = parseInt(headers.get('x-wp-totalpages') || '1', 10);
        hasMore = page < totalPages;
        page++;

        // Early exit optimization: If we've fetched enough products for current page + next few pages
        // and we're on a later page, we can stop early (but still need to filter all fetched)
        // Note: This is a trade-off between completeness and performance
      }

      // Log performance metrics
      if (allProducts.length > 0) {
        console.log(`[Products API] Fetched ${allProducts.length} products in ${Date.now() - startTime}ms for custom filters`);
      }

      // Apply all filters to fetched products
      // Note: If we hit maxProductsToFetch limit, some products may be missing from results
      const filterStartTime = Date.now();
      let filteredProducts = allProducts.filter((product: any) => {
        // Filter by length
        if (minLength !== undefined || maxLength !== undefined) {
          const lengthMeta = product.meta_data?.find((meta: any) => meta.key === 'length');
          const length = lengthMeta ? parseFloat(lengthMeta.value) : 0;
          if (minLength !== undefined && length < minLength) return false;
          if (maxLength !== undefined && length > maxLength) return false;
        }

        // Filter by material
        // Priority: 1. Check product attributes (pa_material, material), 2. Fallback to meta_data (ACF)
        if (material) {
          let materialMatch = false;
          
          // Step 1: Check product attributes (pa_material, material)
          const materialAttr = product.attributes?.find((attr: any) => {
            const attrName = attr.name?.toLowerCase() || '';
            return attrName === 'pa_material' || 
                   attrName === 'material' || 
                   attrName === 'chất liệu' ||
                   attrName.includes('material');
          });
          
          if (materialAttr && materialAttr.options && Array.isArray(materialAttr.options)) {
            // Check if any option matches the filter value (case-insensitive)
            materialMatch = materialAttr.options.some((option: string) => {
              const optionLower = String(option).toLowerCase().trim();
              const materialLower = String(material).toLowerCase().trim();
              return optionLower === materialLower || 
                     optionLower.includes(materialLower) || 
                     materialLower.includes(optionLower);
            });
          }
          
          // Step 2: If not found in attributes, fallback to meta_data (ACF field)
          if (!materialMatch) {
            const materialMeta = product.meta_data?.find((meta: any) => meta.key === 'material');
            const productMaterial = materialMeta?.value ? String(materialMeta.value) : '';
            if (productMaterial) {
              const productMaterialLower = productMaterial.toLowerCase().trim();
              const materialLower = String(material).toLowerCase().trim();
              materialMatch = productMaterialLower === materialLower || 
                             productMaterialLower.includes(materialLower) || 
                             materialLower.includes(productMaterialLower);
            }
          }
          
          // If no match found, exclude this product
          if (!materialMatch) {
            return false;
          }
        }

        // Filter by price range
        if (minPrice !== undefined || maxPrice !== undefined) {
          const price = parseFloat(product.price || '0');
          if (minPrice !== undefined && price < minPrice) return false;
          if (maxPrice !== undefined && price > maxPrice) return false;
        }

        // Filter by size
        // Priority: 1. Check product attributes (pa_size, size), 2. Fallback to length-based logic
        if (size) {
          let sizeMatch = false;
          
          // Step 1: Check product attributes (pa_size, size)
          const sizeAttr = product.attributes?.find((attr: any) => {
            const attrName = attr.name?.toLowerCase() || '';
            return attrName === 'pa_size' || 
                   attrName === 'size' || 
                   attrName === 'kích thước' ||
                   attrName.includes('size');
          });
          
          if (sizeAttr && sizeAttr.options && Array.isArray(sizeAttr.options)) {
            // Check if any option matches the filter value (case-insensitive)
            sizeMatch = sizeAttr.options.some((option: string) => {
              const optionLower = String(option).toLowerCase().trim();
              const sizeLower = String(size).toLowerCase().trim();
              return optionLower === sizeLower || optionLower.includes(sizeLower) || sizeLower.includes(optionLower);
            });
          }
          
          // Step 2: If not found in attributes, fallback to length-based logic for predefined categories
          if (!sizeMatch) {
            const lengthMeta = product.meta_data?.find((meta: any) => meta.key === 'length');
            const length = lengthMeta ? parseFloat(lengthMeta.value) : 0;
            
            // Map predefined size categories to length ranges
            switch (size) {
              case 'Nhỏ':
                sizeMatch = length > 0 && length < 30;
                break;
              case 'Vừa':
                sizeMatch = length >= 30 && length <= 50;
                break;
              case 'Lớn':
                sizeMatch = length > 50 && length <= 80;
                break;
              case 'Rất lớn':
                sizeMatch = length > 80;
                break;
              default:
                // For other size values (e.g., "60cm", "1m2"), try to extract number and compare with length
                const sizeNumber = parseFloat(String(size).replace(/[^0-9.]/g, ''));
                if (!isNaN(sizeNumber) && length > 0) {
                  // Allow ±5cm tolerance for size matching
                  sizeMatch = Math.abs(length - sizeNumber) <= 5;
                } else {
                  // If we can't parse, don't match
                  sizeMatch = false;
                }
                break;
            }
          }
          
          // If no match found, exclude this product
          if (!sizeMatch) {
            return false;
          }
        }

        // Filter by color (from attributes)
        if (color) {
          const colorAttr = product.attributes?.find((attr: any) => 
            attr.name?.toLowerCase().includes('color') || attr.name === 'pa_color'
          );
          if (!colorAttr || !colorAttr.options?.some((opt: string) => 
            opt.toLowerCase() === color.toLowerCase()
          )) {
            return false;
          }
        }

        return true;
      });

      const filterTime = Date.now() - filterStartTime;
      if (filteredProducts.length > 0) {
        console.log(`[Products API] Filtered ${filteredProducts.length} products from ${allProducts.length} in ${filterTime}ms`);
      }

      // Calculate pagination for filtered results
      const totalFiltered = filteredProducts.length;
      const totalPages = Math.ceil(totalFiltered / originalPerPage);
      
      // Apply pagination to filtered results
      const startIndex = (currentPage - 1) * originalPerPage;
      const endIndex = startIndex + originalPerPage;
      filteredProducts = filteredProducts.slice(startIndex, endIndex);

      // Warning if we hit limits (products may be incomplete)
      const hitLimit = allProducts.length >= maxProductsToFetch || page > maxPages;
      const warning = hitLimit 
        ? 'Kết quả có thể không đầy đủ do giới hạn hiệu năng. Vui lòng thu hẹp bộ lọc để tìm thấy tất cả sản phẩm.'
        : undefined;

      return NextResponse.json({
        products: filteredProducts,
        pagination: {
          total: totalFiltered,
          totalPages,
          currentPage,
          perPage: originalPerPage,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
        ...(warning && { warning }), // Include warning if limits were hit
      });
    }

    // No custom filters - use WooCommerce native pagination
    const fetchParams = { ...params, per_page: originalPerPage, page: currentPage };
    const result = await wcApi.getProducts(fetchParams, true);
    const products = Array.isArray(result) ? result : result.data;
    const headers = Array.isArray(result) ? new Headers() : result.headers;

    // Extract pagination info từ WooCommerce response headers
    const totalProducts = parseInt(headers.get('x-wp-total') || '0', 10);
    const totalPages = parseInt(headers.get('x-wp-totalpages') || '1', 10);

    return NextResponse.json({
      products,
      pagination: {
        total: totalProducts,
        totalPages,
        currentPage,
        perPage: originalPerPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

