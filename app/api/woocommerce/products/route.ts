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

    // Remove custom filters from WooCommerce params (they'll be filtered server-side)
    delete params.min_length;
    delete params.max_length;
    delete params.min_price;
    delete params.max_price;
    delete params.material;

    // Fetch products từ WooCommerce REST API với headers (for pagination)
    // Fetch more products if we need to filter (to ensure we have enough after filtering)
    const originalPerPage = params.per_page ? parseInt(String(params.per_page), 10) : 10;
    const fetchPerPage = (minLength || maxLength || material) ? Math.max(originalPerPage * 3, 50) : originalPerPage;
    const fetchParams = { ...params, per_page: fetchPerPage };
    
    const result = await wcApi.getProducts(fetchParams, true);
    const products = Array.isArray(result) ? result : result.data;
    const headers = Array.isArray(result) ? new Headers() : result.headers;

    // Server-side filtering for custom attributes (ACF fields in meta_data)
    let filteredProducts = products;
    
    if (minLength !== undefined || maxLength !== undefined || material) {
      filteredProducts = products.filter((product: any) => {
        // Get length from meta_data
        const lengthMeta = product.meta_data?.find((meta: any) => meta.key === 'length');
        const length = lengthMeta ? parseFloat(lengthMeta.value) : 0;

        // Filter by length
        if (minLength !== undefined && length < minLength) return false;
        if (maxLength !== undefined && length > maxLength) return false;

        // Filter by material
        if (material) {
          const materialMeta = product.meta_data?.find((meta: any) => meta.key === 'material');
          const productMaterial = materialMeta?.value || '';
          if (productMaterial.toLowerCase() !== material.toLowerCase()) return false;
        }

        return true;
      });

      // Limit to requested per_page after filtering
      filteredProducts = filteredProducts.slice(0, originalPerPage);
    }

    // Filter by price range (if needed, though WooCommerce might support this)
    if (minPrice !== undefined || maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter((product: any) => {
        const price = parseFloat(product.price || '0');
        if (minPrice !== undefined && price < minPrice) return false;
        if (maxPrice !== undefined && price > maxPrice) return false;
        return true;
      });
    }

    // Extract pagination info từ WooCommerce response headers
    const totalProducts = headers.get('x-wp-total');
    const totalPages = headers.get('x-wp-totalpages');
    
    // Parse pagination values
    // Note: When filtering server-side, pagination info is approximate
    const total = filteredProducts.length;
    const pages = 1; // Single page after filtering
    
    // Get current page from params (default to 1)
    const currentPage = params.page ? parseInt(String(params.page), 10) : 1;
    const perPage = originalPerPage;

    return NextResponse.json({
      products: filteredProducts,
      pagination: {
        total,
        totalPages: pages,
        currentPage,
        perPage,
        hasNextPage: false, // Filtered results are single page
        hasPrevPage: false,
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

