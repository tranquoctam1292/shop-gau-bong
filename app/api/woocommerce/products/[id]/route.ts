import { NextRequest, NextResponse } from 'next/server';
import { wcApi } from '@/lib/api/woocommerce';

/**
 * API Route: Proxy WooCommerce Single Product API
 * GET /api/woocommerce/products/[id]
 * 
 * Proxy requests từ client đến WooCommerce REST API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await wcApi.getProduct(productId);

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

