import { NextRequest, NextResponse } from 'next/server';
import { wcApi } from '@/lib/api/woocommerce';

/**
 * API Route: Proxy WooCommerce Product Variations API
 * GET /api/woocommerce/products/[id]/variations
 * 
 * Proxy requests từ client đến WooCommerce REST API
 * để bảo mật Consumer Key & Secret
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

    const variations = await wcApi.getProductVariations(productId);

    return NextResponse.json(variations, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching product variations:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch product variations' },
      { status: 500 }
    );
  }
}

